import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db.js";
import { players } from "../schema.js";

export const playersRoute = new Hono();

playersRoute.get("/", (c) => {
  return c.json(db.select().from(players).orderBy(players.name).all());
});

playersRoute.post("/", async (c) => {
  const body = await c.req.json<{ name?: string }>();
  const name = body.name?.trim();
  if (!name) return c.json({ error: "name is required" }, 400);

  const existing = db.select().from(players).where(eq(players.name, name)).get();
  if (existing) return c.json(existing);

  const inserted = db
    .insert(players)
    .values({ name, createdAt: new Date().toISOString() })
    .returning()
    .get();
  return c.json(inserted, 201);
});

playersRoute.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);
  db.delete(players).where(eq(players.id, id)).run();
  return c.json({ ok: true });
});
