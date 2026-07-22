# Farkle Score v2: Build & Run Guide

This document is self-contained. A human or an AI agent following it top to bottom can
clone, build, test, run, and deploy this project with no other context. Read the whole
document before executing anything.

## 1. What this project is

A Farkle (dice game) scorekeeping web app:

- **Client** (`client/`): Vite + React + TypeScript single-page app. One phone scores the
  game; screens cover player setup, table order, live scoring, house rules, stats, game
  history/replay, and a help center.
- **Server** (`server/`): Node 22 + Hono HTTP API with SQLite storage (better-sqlite3 +
  Drizzle ORM). Also fans out live game state to spectator phones over WebSocket and
  serves the built client in production.
- **Engine** (`packages/engine/`): pure TypeScript game logic shared by client and server.
  Scoring rules, turn/roll state machine, ruleset validation, and an exact probability
  engine (farkle odds, expected values, per-turn likelihood). No I/O, no dependencies,
  fully unit-tested. **All correctness lives here.**
- **Deploy** (`deploy/`): multi-stage Dockerfile + docker-compose for a single container.

## 2. Critical repository facts (read before touching git)

- Repo: `https://github.com/XTim97/farkle-score`
- **The app lives on branch `feature/big-updates`. Never merge it with `main`.**
  `main` holds an unrelated legacy v1 app owned by the upstream author and may be
  force-pushed. The two branches share no git history by design. Do not open PRs between
  them, do not rebase one onto the other, do not "clean up" the divergence.
- All work continues on `feature/big-updates` (or branches cut from it).

```bash
git clone https://github.com/XTim97/farkle-score.git
cd farkle-score
git checkout feature/big-updates
```

## 3. Prerequisites

- **Node 22** (see `.nvmrc`). Node 18 will not work (Vite and better-sqlite3 require 20+,
  and several build scripts use ESM features). With nvm: `nvm use` (or
  `nvm install 22 && nvm use 22`).
- **npm 10+** (bundled with Node 22).
- **Docker + docker compose** for deployment (not needed for development).
- Linux/macOS assumed; Windows should use WSL2.

## 4. Install

```bash
npm install
```

This installs all three workspaces (npm workspaces: `packages/engine`, `server`,
`client`). Dependencies are pinned to exact versions on purpose; do not loosen them to
ranges and do not add `"latest"`.

**Known gotcha:** if a later `npm install <pkg>` leaves you with an error like
"Cannot find module @rolldown/binding-linux-x64-gnu", you hit npm's optional-dependencies
bug. Fix: `rm -rf node_modules package-lock.json && npm install`.

## 5. Develop

```bash
npm run dev
```

Starts both halves:
- Server on **http://localhost:8787** (tsx watch; SQLite file auto-created at `./data/farkle.db`)
- Vite client on **http://localhost:5173**, proxying `/api` (including WebSocket) to 8787.

Open http://localhost:5173. The database schema bootstraps itself on server start
(`server/src/db.ts`), including additive column migrations for older databases.

## 6. Verify (run all of these; all must pass)

```bash
npm run typecheck   # strict TS across all workspaces: zero errors expected
npm test            # engine test suites (~90 tests) incl. Monte Carlo validation
npm run build       # engine typecheck + client bundle + server typecheck
```

The engine tests are the correctness gate. They include:
- full game/turn/roll state-machine coverage (hot dice, undo, entry threshold,
  three-farkle penalty, final round, tie-breaks)
- exact odds values checked against closed-form probability (e.g. six-dice farkle
  2.31%, 1/216 triples, inclusion-exclusion joint combos)
- validation identities (outcome weights sum to 1; farkle prob is the exact complement
  of any-combo-available) and 1.2M seeded Monte Carlo rolls converging on the
  enumeration.

A quick end-to-end API check while the dev server runs:

```bash
curl -s localhost:8787/api/health
# expect {"status":"ok","version":"<x.y.z>","ruleset":"House Rules","players":N}
```

## 7. Deploy (Docker)

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

- Container `farkle-score`, host port **8793** → container 8787.
- SQLite data is bind-mounted at `./data` on the host (gitignored). **That directory is
  the only state; back it up to preserve game history.**
- The image is multi-stage: build stage installs a compile toolchain (python3/make/g++)
  because better-sqlite3 may compile from source, then production files and pruned
  node_modules are copied into a slim runtime. The server runs via tsx (a regular
  dependency, not a devDependency, for exactly this reason).

Verify after deploy:

```bash
curl -s http://<host>:8793/api/health          # status ok, correct version
curl -s -X POST http://<host>:8793/api/live    # returns {"code":"XXXXXX"}
```

Redeploying after changes is the same command; compose rebuilds and swaps the container.
The database survives because it lives on the host bind mount.

## 8. Architecture map (where to change what)

| Concern | Location |
|---|---|
| Scoring combos, points, dice consumed | `packages/engine/src/combos.ts` |
| Ruleset shape, defaults, validation | `packages/engine/src/ruleset.ts` |
| Turn/roll/game state machine | `packages/engine/src/game.ts` |
| Odds (farkle %, per-combo, EV, roll-vs-bank) | `packages/engine/src/odds.ts` |
| Per-turn likelihood, joint combo probability | `packages/engine/src/probability.ts` |
| DB schema + bootstrap/migrations | `server/src/schema.ts`, `server/src/db.ts` |
| REST routes | `server/src/routes/*.ts` (players, games, rulesets, stats, live) |
| Live WebSocket sessions | `server/src/live.ts` (in-memory, 24h TTL) |
| Screens/components | `client/src/components/*.tsx` |
| App navigation + game orchestration | `client/src/App.tsx` |
| All styling (single stylesheet, light+dark) | `client/src/style.css` |
| API client + payload shapes | `client/src/api.ts` |

Data-flow invariants an agent must preserve:

1. **The engine is pure.** No fetch, no fs, no Date.now inside `packages/engine`. Client
   and server both import it; game correctness and all probabilities derive from it.
2. **The scorer's browser is authoritative during play.** The server persists finished
   games (`POST /api/games`) and relays live state (`PUT /api/live/:code` → WebSocket
   fan-out). A server restart must never corrupt an in-progress game.
3. **Finished games freeze their ruleset** as JSON on the game row so history and stats
   stay correct when rulesets are edited later.
4. **Roll tracking feeds the luck stats.** Turns record per-roll dice counts
   (`turns.rolls_json`) and events carry `roll_index`. NULL in those columns marks
   legacy turns; stats code must keep treating NULL as "unknown, skip luck math".
5. **Probabilities are exact enumeration, never simulation or hardcoded tables.** New
   probability features should follow the same pattern (enumerate face-count multisets
   with multinomial weights, memoize) and ship with closed-form and/or Monte Carlo tests.

## 9. Conventions

- TypeScript strict everywhere; `npm run typecheck` must stay at zero errors.
- Exact-pinned dependency versions (`npm install -E`).
- Version is single-sourced from `package.json` (all four stay in lockstep); the server
  reads its own `package.json` for `/api/health`.
- Engine changes require tests in `packages/engine/test/`. UI is tested lightly; the
  engine is tested exhaustively.
- Mobile-first UI, single stylesheet with CSS variables, automatic dark mode via
  `prefers-color-scheme`. Chart/series colors are a CVD-validated fixed palette; do not
  reorder or "refresh" them casually.
- Commit style: imperative summary line, body explaining what and why.

## 10. Smoke-test playbook (manual, ~3 minutes)

1. Open the app, add two players, arrange order, pick a first player, start.
2. Tap a combo, then ↻ Roll, then another combo, then Bank. Confirm the turn score moved
   to the scoreboard and the next player is active.
3. Score combos totaling all six dice: the buttons must light back up automatically
   ("🔥 Hot dice!"), with no Roll tap needed. Undo once: the whole hot combo reverts.
4. Expand the 📊 Stats strip: farkle %, EV, roll-vs-bank, bank-now place, per-combo odds,
   and the per-player display preference pills (Nothing / Farkle % / Top odds / Coach).
5. Tap 📺 Live, open the URL/QR from a second device, score something: the viewer updates
   in under a second.
6. Finish a game (create a low-winning-score ruleset under ⚙️ House Rules to speed this
   up). Confirm the winner screen, then check 📊 Stats (expanded player card) and 🕘 Game
   History → replay chart, turn list with 🎲 likelihood percentages.

## 11. Deployment notes

- The reference deployment is the compose file as-is: one container on host port 8793,
  reachable on the operator's private network. Details of any specific environment are
  intentionally kept out of this repository.
- Remember that `./data` on the deploy host is the only state; include it in whatever
  backup scheme the host uses.
