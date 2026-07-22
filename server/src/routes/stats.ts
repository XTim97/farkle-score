import { computeOdds, DICE_PER_TURN, type OddsResult, type Ruleset } from "@farkle/engine";
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
  // Luck (roll-tracked turns only, except fatal-roll severity which covers all)
  knownRolls: number;
  expectedFarkles: number;
  knownFarkles: number;
  expectedPoints: number;
  actualPoints: number;
  /** Mean farkle probability of the rolls that actually farkled (all turns). */
  avgFatalRollProb: number | null;
  // Caution (all turns; dice remaining is reconstructable either way)
  avgDiceLeftAtBank: number | null;
  riskyRolls: number;
}

interface TurnRow {
  id: number;
  gameId: number;
  playerId: number;
  banked: number;
  farkled: number;
  rollsJson: string | null;
}

interface EventRow {
  turnId: number;
  points: number;
  diceUsed: number;
  rollIndex: number | null;
}

const aggregateSql = `
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
`;

interface LuckAgg {
  knownRolls: number;
  expectedFarkles: number;
  knownFarkles: number;
  expectedPoints: number;
  actualPoints: number;
  fatalProbSum: number;
  fatalCount: number;
  bankDiceSum: number;
  bankCount: number;
  riskyRolls: number;
}

const emptyLuck = (): LuckAgg => ({
  knownRolls: 0,
  expectedFarkles: 0,
  knownFarkles: 0,
  expectedPoints: 0,
  actualPoints: 0,
  fatalProbSum: 0,
  fatalCount: 0,
  bankDiceSum: 0,
  bankCount: 0,
  riskyRolls: 0
});

/**
 * Walk every recorded turn and score it against the exact odds of its game's
 * frozen ruleset. Roll-tracked turns contribute the full luck ledger; legacy
 * turns (unknown roll boundaries) still yield fatal-roll severity and
 * banking caution via the flat dice fold.
 */
function computeLuck(): Map<number, LuckAgg> {
  const rulesets = new Map<number, Ruleset>(
    (
      sqlite.prepare("SELECT id, ruleset_json AS rulesetJson FROM games").all() as Array<{
        id: number;
        rulesetJson: string;
      }>
    ).map((g) => [g.id, JSON.parse(g.rulesetJson) as Ruleset])
  );
  const turnRows = sqlite
    .prepare(
      "SELECT id, game_id AS gameId, player_id AS playerId, banked, farkled, rolls_json AS rollsJson FROM turns"
    )
    .all() as TurnRow[];
  const eventRows = sqlite
    .prepare(
      "SELECT turn_id AS turnId, points, dice_used AS diceUsed, roll_index AS rollIndex FROM scoring_events ORDER BY turn_id, seq"
    )
    .all() as EventRow[];

  const eventsByTurn = new Map<number, EventRow[]>();
  for (const e of eventRows) {
    const list = eventsByTurn.get(e.turnId);
    if (list) list.push(e);
    else eventsByTurn.set(e.turnId, [e]);
  }

  const oddsMemo = new Map<string, OddsResult>();
  const oddsFor = (gameId: number, dice: number): OddsResult | null => {
    const ruleset = rulesets.get(gameId);
    if (!ruleset || dice < 1 || dice > 6) return null;
    const key = `${gameId}:${dice}`;
    let odds = oddsMemo.get(key);
    if (!odds) {
      odds = computeOdds(dice, ruleset);
      oddsMemo.set(key, odds);
    }
    return odds;
  };

  const byPlayer = new Map<number, LuckAgg>();
  for (const turn of turnRows) {
    const ruleset = rulesets.get(turn.gameId);
    if (!ruleset) continue;
    let agg = byPlayer.get(turn.playerId);
    if (!agg) {
      agg = emptyLuck();
      byPlayer.set(turn.playerId, agg);
    }
    const events = eventsByTurn.get(turn.id) ?? [];

    if (turn.rollsJson) {
      const rolls = JSON.parse(turn.rollsJson) as number[];
      agg.knownRolls += rolls.length;
      agg.knownFarkles += turn.farkled ? 1 : 0;
      for (const dice of rolls) {
        const odds = oddsFor(turn.gameId, dice);
        if (!odds) continue;
        agg.expectedFarkles += odds.pFarkle;
        agg.expectedPoints += odds.expectedRollScore;
        if (dice <= 2) agg.riskyRolls += 1;
      }
      agg.actualPoints += events.reduce((sum, e) => sum + e.points, 0);
      const lastDice = rolls.at(-1) ?? DICE_PER_TURN;
      if (turn.farkled) {
        const odds = oddsFor(turn.gameId, lastDice);
        if (odds) {
          agg.fatalProbSum += odds.pFarkle;
          agg.fatalCount += 1;
        }
      } else {
        const lastUsed = events
          .filter((e) => e.rollIndex === rolls.length - 1)
          .reduce((sum, e) => sum + e.diceUsed, 0);
        const remaining = lastDice - lastUsed;
        agg.bankDiceSum +=
          remaining === 0 && ruleset.hotDice ? DICE_PER_TURN : remaining;
        agg.bankCount += 1;
      }
    } else {
      // Legacy turn: reconstruct dice remaining with the flat fold the old
      // engine used (auto hot-dice reset), enough for severity and caution.
      let remaining = DICE_PER_TURN;
      for (const e of events) {
        remaining -= e.diceUsed;
        if (remaining === 0 && ruleset.hotDice) remaining = DICE_PER_TURN;
      }
      if (turn.farkled) {
        if (remaining > 0) {
          const odds = oddsFor(turn.gameId, remaining);
          if (odds) {
            agg.fatalProbSum += odds.pFarkle;
            agg.fatalCount += 1;
          }
        }
      } else {
        agg.bankDiceSum += remaining === 0 && !ruleset.hotDice ? 0 : remaining;
        agg.bankCount += 1;
      }
    }
  }
  return byPlayer;
}

export const statsRoute = new Hono();

statsRoute.get("/", (c) => {
  const rows = sqlite.prepare(aggregateSql).all() as Array<
    Omit<
      PlayerStats,
      | "knownRolls"
      | "expectedFarkles"
      | "knownFarkles"
      | "expectedPoints"
      | "actualPoints"
      | "avgFatalRollProb"
      | "avgDiceLeftAtBank"
      | "riskyRolls"
    >
  >;
  const luck = computeLuck();
  return c.json(
    rows.map((row): PlayerStats => {
      const l = luck.get(row.playerId) ?? emptyLuck();
      return {
        ...row,
        knownRolls: l.knownRolls,
        expectedFarkles: l.expectedFarkles,
        knownFarkles: l.knownFarkles,
        expectedPoints: l.expectedPoints,
        actualPoints: l.actualPoints,
        avgFatalRollProb: l.fatalCount > 0 ? l.fatalProbSum / l.fatalCount : null,
        avgDiceLeftAtBank: l.bankCount > 0 ? l.bankDiceSum / l.bankCount : null,
        riskyRolls: l.riskyRolls
      };
    })
  );
});
