import { Hono } from "hono";
import { sqlite } from "../db.js";

export interface PlayerStats {
  playerId: number;
  name: string;
  gamesPlayed: number;
  wins: number;
  totalBanked: number;
  turns: number;
  farkles: number;
  bestTurn: number;
  bestGame: number;
  threeFarklePenalties: number;
  hotDiceTurns: number;
}

export const statsRoute = new Hono();

statsRoute.get("/", (c) => {
  const rows = sqlite
    .prepare(
      `
      SELECT
        p.id AS playerId,
        p.name,
        COALESCE(g.games, 0) AS gamesPlayed,
        COALESCE(w.wins, 0) AS wins,
        COALESCE(g.bestGame, 0) AS bestGame,
        COALESCE(t.turns, 0) AS turns,
        COALESCE(t.farkles, 0) AS farkles,
        COALESCE(t.totalBanked, 0) AS totalBanked,
        COALESCE(t.bestTurn, 0) AS bestTurn,
        COALESCE(t.threeFarklePenalties, 0) AS threeFarklePenalties,
        COALESCE(h.hotDiceTurns, 0) AS hotDiceTurns
      FROM players p
      LEFT JOIN (
        SELECT player_id, COUNT(*) AS games, MAX(final_score) AS bestGame
        FROM game_players GROUP BY player_id
      ) g ON g.player_id = p.id
      LEFT JOIN (
        SELECT winner_id, COUNT(*) AS wins FROM games GROUP BY winner_id
      ) w ON w.winner_id = p.id
      LEFT JOIN (
        SELECT player_id,
               COUNT(*) AS turns,
               SUM(farkled) AS farkles,
               SUM(banked) AS totalBanked,
               MAX(banked) AS bestTurn,
               SUM(CASE WHEN penalty > 0 THEN 1 ELSE 0 END) AS threeFarklePenalties
        FROM turns GROUP BY player_id
      ) t ON t.player_id = p.id
      LEFT JOIN (
        SELECT t.player_id, COUNT(*) AS hotDiceTurns
        FROM turns t
        WHERE (SELECT COALESCE(SUM(e.dice_used), 0)
               FROM scoring_events e WHERE e.turn_id = t.id) > 6
        GROUP BY t.player_id
      ) h ON h.player_id = p.id
      ORDER BY wins DESC, gamesPlayed DESC, p.name
      `
    )
    .all() as PlayerStats[];
  return c.json(rows);
});
