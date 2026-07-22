import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { DEFAULT_RULESET } from "@farkle/engine";
import { Hono } from "hono";
import { db } from "./db.js";
import { players } from "./schema.js";
import { gamesRoute } from "./routes/games.js";
import { playersRoute } from "./routes/players.js";
import { rulesetsRoute } from "./routes/rulesets.js";
import { statsRoute } from "./routes/stats.js";

const app = new Hono();

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    version: process.env.npm_package_version ?? "dev",
    ruleset: DEFAULT_RULESET.name,
    players: db.select().from(players).all().length
  })
);

app.route("/api/players", playersRoute);
app.route("/api/games", gamesRoute);
app.route("/api/rulesets", rulesetsRoute);
app.route("/api/stats", statsRoute);

// Production: serve the built client. In dev, Vite serves the client and proxies /api here.
app.use("/*", serveStatic({ root: "./client-dist" }));
app.get("*", serveStatic({ path: "./client-dist/index.html" }));

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`farkle-score server listening on :${info.port}`);
});
