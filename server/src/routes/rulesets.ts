import { validateRuleset, type Ruleset } from "@farkle/engine";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db.js";
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
  return c.json(db.select().from(rulesets).orderBy(rulesets.name).all().map(parsed));
});

rulesetsRoute.post("/", async (c) => {
  const config = await c.req.json<Ruleset>();
  config.name = config.name?.trim();
  const errors = validateRuleset(config);
  if (errors.length) return c.json({ errors }, 400);
  if (db.select().from(rulesets).where(eq(rulesets.name, config.name)).get()) {
    return c.json({ errors: [`A ruleset named "${config.name}" already exists`] }, 409);
  }
  const row = db
    .insert(rulesets)
    .values({
      name: config.name,
      configJson: JSON.stringify(config),
      createdAt: new Date().toISOString()
    })
    .returning()
    .get();
  return c.json(parsed(row), 201);
});

rulesetsRoute.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ errors: ["invalid id"] }, 400);
  const config = await c.req.json<Ruleset>();
  config.name = config.name?.trim();
  const errors = validateRuleset(config);
  if (errors.length) return c.json({ errors }, 400);
  const clash = db.select().from(rulesets).where(eq(rulesets.name, config.name)).get();
  if (clash && clash.id !== id) {
    return c.json({ errors: [`A ruleset named "${config.name}" already exists`] }, 409);
  }
  const row = db
    .update(rulesets)
    .set({ name: config.name, configJson: JSON.stringify(config) })
    .where(eq(rulesets.id, id))
    .returning()
    .get();
  if (!row) return c.json({ errors: ["not found"] }, 404);
  return c.json(parsed(row));
});

rulesetsRoute.delete("/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ errors: ["invalid id"] }, 400);
  db.delete(rulesets).where(eq(rulesets.id, id)).run();
  return c.json({ ok: true });
});
