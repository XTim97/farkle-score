import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { DEFAULT_RULESET } from "@farkle/engine";
import { Hono } from "hono";
import { readFileSync } from "node:fs";
import { db } from "./db.js";
import { apiBodyLimit, apiGuard } from "./guard.js";
import { players } from "./schema.js";
import { handleUpgrade } from "./live.js";
import { gamesRoute } from "./routes/games.js";
import { liveRoute } from "./routes/live.js";
import { playersRoute } from "./routes/players.js";
import { rulesetsRoute } from "./routes/rulesets.js";
import { statsRoute } from "./routes/stats.js";

const app = new Hono();

app.use("/api/*", apiGuard);
app.use("/api/*", apiBodyLimit);

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as { version: string };

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    version,
    ruleset: DEFAULT_RULESET.name,
    players: db.select().from(players).all().length
  })
);

app.route("/api/players", playersRoute);
app.route("/api/games", gamesRoute);
app.route("/api/rulesets", rulesetsRoute);
app.route("/api/stats", statsRoute);
app.route("/api/live", liveRoute);

// Production: serve the built client. In dev, Vite serves the client and proxies /api here.
app.use("/*", serveStatic({ root: "./client-dist" }));
app.get("*", serveStatic({ path: "./client-dist/index.html" }));

const port = Number(process.env.PORT ?? 8787);
const server = serve({ fetch: app.fetch, port }, (info) => {
  console.log(`farkle-score server listening on :${info.port}`);
});
server.on("upgrade", handleUpgrade);
