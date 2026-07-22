import { Hono } from "hono";
import { createSession, getSession, publishState } from "../live.js";

export const liveRoute = new Hono();

liveRoute.post("/", (c) => {
  return c.json({ code: createSession() }, 201);
});

liveRoute.get("/:code", (c) => {
  const session = getSession(c.req.param("code"));
  if (!session) return c.json({ error: "not found" }, 404);
  if (!session.state) return c.json({ error: "no state yet" }, 404);
  return c.body(session.state, 200, { "Content-Type": "application/json" });
});

liveRoute.put("/:code", async (c) => {
  const body = await c.req.text();
  if (!body) return c.json({ error: "empty state" }, 400);
  try {
    JSON.parse(body);
  } catch {
    return c.json({ error: "state must be JSON" }, 400);
  }
  if (!publishState(c.req.param("code"), body)) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json({ ok: true });
});
