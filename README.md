# Farkle Score v2

A ground-up rewrite of the Farkle scorekeeper: React PWA client, Hono + SQLite server,
and a shared pure scoring/odds engine. See `PLAN.md` for the full build plan and phases.

## Layout

- `packages/engine/` - pure game logic: combos, rulesets, scoring, odds. Fully tested.
- `server/` - Node 22 + Hono API, SQLite via Drizzle, serves the client build in prod.
- `client/` - Vite + React + TypeScript app.
- `deploy/` - Dockerfile and compose for the homelab deployment.

## Develop

```bash
nvm use            # Node 22
npm install
npm run dev        # server :8787 + Vite client :5173 (proxies /api)
npm test
npm run typecheck
```

## Deploy

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

App data (SQLite) lives in the `farkle-data` volume, mounted at `/data`.
