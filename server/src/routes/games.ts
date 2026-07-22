import type { CompletedTurn, Ruleset } from "@farkle/engine";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db, sqlite } from "../db.js";
import { gamePlayers, games, players, scoringEvents, turns } from "../schema.js";

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
  const gameRows = db.select().from(games).orderBy(desc(games.endedAt)).limit(50).all();
  if (gameRows.length === 0) return c.json([]);

  const participants = db
    .select({
      gameId: gamePlayers.gameId,
      playerId: gamePlayers.playerId,
      seatOrder: gamePlayers.seatOrder,
      finalScore: gamePlayers.finalScore,
      name: players.name
    })
    .from(gamePlayers)
    .innerJoin(players, eq(players.id, gamePlayers.playerId))
    .where(
      inArray(
        gamePlayers.gameId,
        gameRows.map((g) => g.id)
      )
    )
    .all();

  return c.json(
    gameRows.map((g) => ({
      id: g.id,
      startedAt: g.startedAt,
      endedAt: g.endedAt,
      winnerId: g.winnerId,
      players: participants
        .filter((p) => p.gameId === g.id)
        .sort((a, b) => b.finalScore - a.finalScore)
        .map(({ playerId, name, finalScore }) => ({ playerId, name, finalScore }))
    }))
  );
});

gamesRoute.get("/:id", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "invalid id" }, 400);
  const game = db.select().from(games).where(eq(games.id, id)).get();
  if (!game) return c.json({ error: "not found" }, 404);

  const participants = db
    .select({
      playerId: gamePlayers.playerId,
      seatOrder: gamePlayers.seatOrder,
      finalScore: gamePlayers.finalScore,
      name: players.name
    })
    .from(gamePlayers)
    .innerJoin(players, eq(players.id, gamePlayers.playerId))
    .where(eq(gamePlayers.gameId, id))
    .orderBy(asc(gamePlayers.seatOrder))
    .all();

  const turnRows = db
    .select()
    .from(turns)
    .where(eq(turns.gameId, id))
    .orderBy(asc(turns.turnNumber))
    .all();

  const eventRows = turnRows.length
    ? db
        .select()
        .from(scoringEvents)
        .where(
          inArray(
            scoringEvents.turnId,
            turnRows.map((t) => t.id)
          )
        )
        .orderBy(asc(scoringEvents.seq))
        .all()
    : [];

  return c.json({
    id: game.id,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    winnerId: game.winnerId,
    ruleset: JSON.parse(game.rulesetJson) as Ruleset,
    players: participants,
    turns: turnRows.map((t) => ({
      turnNumber: t.turnNumber,
      playerId: t.playerId,
      banked: t.banked,
      farkled: t.farkled,
      penalty: t.penalty,
      events: eventRows
        .filter((e) => e.turnId === t.id)
        .map(({ comboKey, points, diceUsed }) => ({ comboKey, points, diceUsed }))
    }))
  });
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
