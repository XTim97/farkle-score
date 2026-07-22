# Farkle App: Comprehensive Build Plan

Status: **shipped as v2.0.0** (2026-07-21). All six phases complete; deployed on the
homelab at http://192.168.1.90:8793. This branch (`feature/big-updates`) diverged
permanently from the upstream repo; the v1 app and container are retired.

## 1. Vision

A modern Farkle scorekeeping app that goes beyond tallying:

- Fast, mistake-resistant score entry at the table (combo buttons, undo, validation).
- Configurable house rules, because every family plays Farkle differently.
- Persistent stats and game history in SQLite.
- A live multi-device scoreboard: one person scores, everyone watches on their own phone.
- An odds engine: because each scored combo consumes a known number of dice, the app always
  knows how many dice remain. From that it computes, exactly, what combos are still possible
  and the probability of rolling each one (and of farkling) on the next roll. This turns the
  app into a push-your-luck advisor, not just a scoreboard.

## 2. Rules Model

### 2.1 Baseline scoring table (current house rules, from v1.2.18)

| Combo | Points | Dice consumed |
|---|---|---|
| Single 1 | 100 | 1 |
| Single 5 | 50 | 1 |
| Three 1s | 300 | 3 |
| Three 2s | 200 | 3 |
| Three 3s | 300 | 3 |
| Three 4s | 400 | 3 |
| Three 5s | 500 | 3 |
| Three 6s | 600 | 3 |
| Four of a Kind | 1,000 | 4 |
| Five of a Kind | 2,000 | 5 |
| Six of a Kind | 3,000 | 6 |
| Full House (triple + pair) | 850 | 5 |
| Three Pairs | 1,500 | 6 |
| Four of a Kind + Pair | 1,500 | 6 |
| Two Triplets | 2,500 | 6 |
| Small Straight (5 in a row) | 850 | 5 |
| Large Straight (1-6) | 1,500 | 6 |

Win condition: first to 10,000 triggers the final round; every other player gets one last
turn; highest total wins.

### 2.2 The "dice consumed" insight

Every scoring event carries `diceUsed`. The engine tracks `diceRemaining` through a turn:

- Turn starts with 6 dice.
- Each scored combo subtracts its `diceUsed`.
- If `diceRemaining` hits 0, the player has "hot dice" and (if the house rule is on) rolls
  all 6 again, continuing the same turn.

This gives us validation for free (you cannot score a Large Straight with 4 dice left) and
powers the odds engine without ever needing to know the individual die faces.

### 2.3 Configurable house rules (ruleset object, stored per game)

| Rule | Default | Notes |
|---|---|---|
| Winning score | 10,000 | |
| Entry threshold | 0 (off) | Common variant: 500 or 1,000 to get "on the board" |
| Three-farkle penalty | off | Common variant: -1,000 after 3 consecutive farkles |
| Hot dice | on | Scoring all 6 dice rolls all 6 again, same turn keeps building |
| Per-combo point values | table above | Every combo's points editable; e.g. Three 1s 300 vs 1,000 |
| Combo enable/disable | all on | Some houses do not play Full House or Small Straight |
| Final round | on | Everyone gets one rebuttal turn |

Rulesets are named and saved (e.g. "Armstrong House Rules", "Standard"), selectable at game
start, and frozen into the game record so historical stats stay accurate if rules change.

## 3. Odds Engine

Pure, dependency-free TypeScript module. Exact enumeration, not simulation: with N dice
there are at most 6^6 = 46,656 outcomes, trivially enumerable in well under a millisecond.
No hardcoded probability tables; everything derives from the active ruleset, so odds stay
correct when house rules change which combos exist.

For a given `diceRemaining` (1-6) and active ruleset:

- **Farkle probability**: share of outcomes containing no scoring combo.
- **Per-combo probability**: share of outcomes in which each combo is available.
- **Expected value of rolling**: expected points gained from the next roll (0 on farkle,
  best-available scoring otherwise), so the UI can show "roll vs bank" guidance:
  EV(roll) vs. current turn score at stake.
- **What is still possible**: with 2 dice remaining, you can only score single 1s/5s; the
  UI greys out impossible combos and shows the max theoretical remaining score.

UI surfacing (toggleable, so purists can hide it):

- Small "3 dice left · 27.8% farkle risk" strip on the active turn.
- Expandable panel with per-combo odds and roll-vs-bank EV.
- Post-game fun stats: "You survived a 66.7% farkle roll", riskiest bank, luckiest roll.

## 4. Architecture

Monorepo, single Docker container, deployed on the homelab behind NginxProxyManager.

```
farkle-score/
├── client/            # Vite + React + TypeScript PWA
├── server/            # Node + Hono + TypeScript API, serves client build in prod
├── packages/engine/   # Shared pure logic: scoring, rules, odds. No I/O, fully tested.
├── deploy/            # Dockerfile, compose, nginx snippet
└── PLAN.md
```

- **Frontend**: Vite + React + TypeScript. PWA (installable, offline-tolerant for
  score-only use). State via Zustand or React context; server sync via TanStack Query.
- **Backend**: Node 22 + Hono. REST for CRUD, WebSocket (or SSE) for the live scoreboard.
- **Database**: SQLite via better-sqlite3 + Drizzle ORM. One file, volume-mounted, and
  covered by the existing borgmatic offsite backups once it lives under a backed-up path.
- **Shared engine package**: scoring math, ruleset logic, and odds live in one pure package
  imported by both client and server. Client can score offline; server is authoritative
  for persisted games.
- **All dependencies pinned to exact versions.** No `"latest"`.

### 4.1 Data model (Drizzle/SQLite)

- `players` (id, name, avatar/color, created_at)
- `rulesets` (id, name, json blob of rule config, created_at)
- `games` (id, ruleset_id, started_at, ended_at, winner_id, status)
- `game_players` (game_id, player_id, seat_order, final_score)
- `turns` (id, game_id, player_id, turn_number, banked_points, farkled, dice_remaining_at_end)
- `scoring_events` (id, turn_id, combo_key, points, dice_used, sequence, undone flag)

Storing every scoring event (not just turn totals) is what makes rich stats and the
"luck" analytics possible later. Undo marks events rather than deleting, preserving an
audit trail.

### 4.2 Multi-device live scoreboard

- Scorer's device drives the game (only one active scorer per game).
- Server broadcasts game state over WebSocket to any number of viewer clients.
- Viewers open a short URL / QR code shown on the scorer's screen; no accounts, no auth
  beyond an unguessable game code. LAN/Tailscale only per hosting decision.
- Viewer screen: scoreboard, current turn ticker, farkle-risk strip, final-round banner.

### 4.3 API sketch

- `POST /api/games` (players + ruleset) / `GET /api/games/:id` / `PATCH` to end or abandon
- `POST /api/games/:id/events` (score, farkle, bank, undo) -> returns updated state
- `GET /api/players`, `POST /api/players`, stats at `GET /api/players/:id/stats`
- `GET /api/odds?dice=N&ruleset=R` (also computed client-side; endpoint exists for viewers)
- `WS /api/games/:id/live`

## 5. Stats & History

Per player, across all games: games played/won, win rate, average banked turn, farkle rate,
highest turn, highest game, three-farkle incidents, score-over-time graph. Per game:
turn-by-turn timeline replay. All derivable from `scoring_events` + `turns`, so no separate
aggregation tables until proven necessary.

## 6. Build Phases

Each phase lands on this branch behind a working build; the app is usable from Phase 1 on.

- **Phase 0, scaffold**: gut old source, monorepo layout, TS + Vite + Hono + Drizzle
  scaffold, pinned deps, Vitest wired, Docker build, CI-less for now (it is a homelab app).
- **Phase 1, engine + core scorekeeping**: shared engine (scoring table, dice tracking,
  turn/game state machine) with a thorough test suite; React screens for player select,
  game, turn history, winner; SQLite persistence of finished games. Feature parity with the
  old app, minus its bugs, plus tests.
- **Phase 2, house rules**: ruleset CRUD + game-start selection; engine fully
  ruleset-driven; entry threshold and three-farkle penalty implemented.
- **Phase 3, odds engine**: enumeration module + farkle-risk strip + odds panel + EV
  roll-vs-bank hint. Property tests against known values (e.g. 1 die farkle = 4/6).
- **Phase 4, stats & history**: player stats screens, game timeline, score graphs.
- **Phase 5, live scoreboard**: WebSocket state broadcast, viewer route, QR join.
- **Phase 6, deploy**: Dockerfile + compose, NPM proxy entry, volume + backup path for
  SQLite, replace the old v1.2.8 container on port 8793.

## 7. Engineering Standards

- TypeScript everywhere, strict mode.
- Engine package: 100% pure functions, exhaustively tested (Vitest). UI tested lightly;
  the engine is where correctness lives.
- Exact-pinned dependencies; renovate/upgrade manually and deliberately.
- Version single-sourced from `package.json`.
- Conventional commit messages on this branch; squash-merge philosophy abandoned along
  with upstream.

## 8. Decisions (resolved 2026-07-21)

1. **Hot dice: yes.** Scoring all 6 dice rolls again and keeps building the same turn.
   Engine, odds enumeration, and stats all model it.
2. **Name: Farkle Score.** Keeping the name for the rewrite.
3. **Roll scoring: additive.** Multiple combo buttons may be tapped per roll; the engine
   enforces only the dice budget (combos consumed cannot exceed dice remaining).
4. **Remote: Tim's repo.** This branch keeps pushing to XTim97/farkle-score. Revisit if
   push access or the divergence ever becomes a problem.
