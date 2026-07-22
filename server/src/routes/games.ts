import type { CompletedTurn, Ruleset } from "@farkle/engine";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { db, sqlite } from "../db.js";
import { gamePlayers, games, scoringEvents, turns } from "../schema.js";

export interface FinishedGamePayload {
  startedAt: string;
  endedAt: string;
  ruleset: Ruleset;
  winnerId: number | null;
  players: Array<{ playerId: number; seatOrder: number; finalScore: number }>;
  turns: Array<Omit<CompletedTurn, "playerId"> & { playerId: number }>;
}

export const gamesRoute = new Hono();

gamesRoute.get("/", (c) => {
  return c.json(db.select().from(games).orderBy(desc(games.endedAt)).limit(50).all());
});

gamesRoute.post("/", async (c) => {
  const body = await c.req.json<FinishedGamePayload>();
  if (!body.players?.length || !body.turns?.length || !body.ruleset) {
    return c.json({ error: "players, turns and ruleset are required" }, 400);
  }

  const save = sqlite.transaction(() => {
    const game = db
      .insert(games)
      .values({
        startedAt: body.startedAt,
        endedAt: body.endedAt,
        winnerId: body.winnerId,
        rulesetJson: JSON.stringify(body.ruleset)
      })
      .returning()
      .get();

    for (const gp of body.players) {
      db.insert(gamePlayers)
        .values({
          gameId: game.id,
          playerId: gp.playerId,
          seatOrder: gp.seatOrder,
          finalScore: gp.finalScore
        })
        .run();
    }

    for (const turn of body.turns) {
      const inserted = db
        .insert(turns)
        .values({
          gameId: game.id,
          playerId: turn.playerId,
          turnNumber: turn.turnNumber,
          banked: turn.banked,
          farkled: turn.farkled,
          penalty: turn.penalty
        })
        .returning()
        .get();
      turn.events.forEach((event, seq) => {
        db.insert(scoringEvents)
          .values({
            turnId: inserted.id,
            comboKey: event.comboKey,
            points: event.points,
            diceUsed: event.diceUsed,
            seq
          })
          .run();
      });
    }
    return game;
  });

  return c.json(save(), 201);
});
