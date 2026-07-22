import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db.js";
import { clubOf } from "../guard.js";
import { players } from "../schema.js";

export const playersRoute = new Hono();

playersRoute.get("/", (c) => {
  const club = clubOf(c);
  if (!club) return c.json([]);
  return c.json(
    db.select().from(players).where(eq(players.club, club)).orderBy(players.name).all()
  );
});

playersRoute.post("/", async (c) => {
  const club = clubOf(c);
  if (!club) return c.json({ error: "missing club id" }, 400);
  const body = await c.req.json<{ name?: string }>();
  const name = body.name?.trim().slice(0, 40);
  if (!name) return c.json({ error: "name is required" }, 400);

  const existing = db
    .select()
    .from(players)
    .where(and(eq(players.name, name), eq(players.club, club)))
    .get();
  if (existing) return c.json(existing);

  const inserted = db
    .insert(players)
    .values({ name, club, createdAt: new Date().toISOString() })
    .returning()
    .get();
  return c.json(inserted, 201);
});

playersRoute.delete("/:id", (c) => {
  const club = clubOf(c);
  if (!club) return c.json({ error: "missing club id" }, 400);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);
  db.delete(players).where(and(eq(players.id, id), eq(players.club, club))).run();
  return c.json({ ok: true });
});
