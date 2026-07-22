import { validateRuleset, type Ruleset } from "@farkle/engine";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db.js";
import { clubOf } from "../guard.js";
import { rulesets } from "../schema.js";

function parsed(row: typeof rulesets.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    config: JSON.parse(row.configJson) as Ruleset
  };
}

export const rulesetsRoute = new Hono();

rulesetsRoute.get("/", (c) => {
  const club = clubOf(c);
  if (!club) return c.json([]);
  return c.json(
    db.select().from(rulesets).where(eq(rulesets.club, club)).orderBy(rulesets.name).all().map(parsed)
  );
});

rulesetsRoute.post("/", async (c) => {
  const club = clubOf(c);
  if (!club) return c.json({ errors: ["missing club id"] }, 400);
  const config = await c.req.json<Ruleset>();
  config.name = config.name?.trim();
  const errors = validateRuleset(config);
  if (errors.length) return c.json({ errors }, 400);
  if (
    db
      .select()
      .from(rulesets)
      .where(and(eq(rulesets.name, config.name), eq(rulesets.club, club)))
      .get()
  ) {
    return c.json({ errors: [`A ruleset named "${config.name}" already exists`] }, 409);
  }
  const row = db
    .insert(rulesets)
    .values({
      name: config.name,
      club,
      configJson: JSON.stringify(config),
      createdAt: new Date().toISOString()
    })
    .returning()
    .get();
  return c.json(parsed(row), 201);
});

rulesetsRoute.put("/:id", async (c) => {
  const club = clubOf(c);
  if (!club) return c.json({ errors: ["missing club id"] }, 400);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ errors: ["invalid id"] }, 400);
  const config = await c.req.json<Ruleset>();
  config.name = config.name?.trim();
  const errors = validateRuleset(config);
  if (errors.length) return c.json({ errors }, 400);
  const clash = db
    .select()
    .from(rulesets)
    .where(and(eq(rulesets.name, config.name), eq(rulesets.club, club)))
    .get();
  if (clash && clash.id !== id) {
    return c.json({ errors: [`A ruleset named "${config.name}" already exists`] }, 409);
  }
  const row = db
    .update(rulesets)
    .set({ name: config.name, configJson: JSON.stringify(config) })
    .where(and(eq(rulesets.id, id), eq(rulesets.club, club)))
    .returning()
    .get();
  if (!row) return c.json({ errors: ["not found"] }, 404);
  return c.json(parsed(row));
});

rulesetsRoute.delete("/:id", (c) => {
  const club = clubOf(c);
  if (!club) return c.json({ errors: ["missing club id"] }, 400);
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ errors: ["invalid id"] }, 400);
  db.delete(rulesets).where(and(eq(rulesets.id, id), eq(rulesets.club, club))).run();
  return c.json({ ok: true });
});
