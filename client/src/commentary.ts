import {
  computeOdds,
  currentPlayer,
  turnLikelihood,
  type CompletedTurn,
  type GameState
} from "@farkle/engine";

/**
 * Ballpark-announcer commentary for the watch screen. Pure and deterministic:
 * the same game state always produces the same line (template variety comes
 * from hashing the turn count), so viewers all see identical commentary and
 * re-renders never flicker.
 */
export interface Commentary {
  line: string;
  color: string | null;
}

const pick = (variants: string[], seed: number) => variants[seed % variants.length]!;

const fmt = (n: number) => n.toLocaleString();

function farkleLine(game: GameState, t: CompletedTurn, name: string, seed: number): string {
  const fatal = t.rolls.at(-1) ?? 6;
  const p = computeOdds(fatal, game.ruleset).pFarkle;
  const pct = (p * 100).toFixed(fatal >= 5 ? 1 : 0);
  if (t.penalty > 0) {
    return pick(
      [
        `📉 Three straight farkles for ${name}! That's a ${fmt(t.penalty)}-point donation to the dice gods.`,
        `📉 ${name} completes the farkle hat trick. The house collects ${fmt(t.penalty)}.`
      ],
      seed
    );
  }
  if (p < 0.1) {
    return pick(
      [
        `💥 ${name} farkles on ${fatal} dice, a ${pct}% catastrophe. The dice have chosen violence.`,
        `💥 Only ${pct}% of ${fatal}-dice rolls come up empty. ${name} found one. Someone check on them.`,
        `💥 A ${pct}% farkle! ${name} should honestly frame this one.`
      ],
      seed
    );
  }
  if (p > 0.5) {
    return pick(
      [
        `💥 ${name} pushed ${fatal} ${fatal === 1 ? "die" : "dice"} at ${pct}% farkle odds and paid the price. Bold strategy.`,
        `💥 ${name} knew the risk (${pct}%), took the risk, met the risk.`
      ],
      seed
    );
  }
  return pick(
    [
      `💥 ${name} farkles. Nothing personal, just ${pct}% odds doing their job.`,
      `💥 The dice say no to ${name}. They were ${pct}% likely to say it.`
    ],
    seed
  );
}

function bankLine(game: GameState, t: CompletedTurn, name: string, seed: number): string {
  const likelihood = t.rolls.length ? turnLikelihood(t.rolls, t.events, false, game.ruleset) : 1;
  const hotCount = t.rolls.filter((d, i) => i > 0 && d === 6).length;
  if (likelihood > 0 && likelihood < 0.02) {
    const oneIn = Math.round(1 / likelihood);
    return pick(
      [
        `🍀 A 1-in-${fmt(oneIn)} turn from ${name}, banking ${fmt(t.banked)}. Buy a lottery ticket on the way home.`,
        `🍀 ${name} just banked a ${fmt(t.banked)}-point turn with 1-in-${fmt(oneIn)} odds. The dice are showing off.`
      ],
      seed
    );
  }
  if (hotCount >= 2) {
    return `♨️ ${name} went hot ${hotCount} times in one turn and banks ${fmt(t.banked)}. Somebody get a fire extinguisher.`;
  }
  if (hotCount === 1) {
    return pick(
      [
        `♨️ Hot dice! ${name} cleared all six and cashes out ${fmt(t.banked)}.`,
        `♨️ ${name} runs the table for ${fmt(t.banked)}. The dice are cooperating... for now.`
      ],
      seed
    );
  }
  if (t.banked >= 2000) {
    return pick(
      [
        `🔥 ${name} banks ${fmt(t.banked)}! The scoreboard just felt that.`,
        `🔥 A ${fmt(t.banked)}-point haul for ${name}. The other players would like to speak to a manager.`
      ],
      seed
    );
  }
  if (t.banked <= 150 && t.rolls.length <= 1) {
    return pick(
      [
        `🏦 ${name} banks a tidy ${fmt(t.banked)}. Risk management in action.`,
        `🏦 ${fmt(t.banked)} for ${name}. Not flashy, but farkles don't pay either.`
      ],
      seed
    );
  }
  return pick(
    [
      `🏦 ${name} banks ${fmt(t.banked)} and keeps the train moving.`,
      `🏦 ${fmt(t.banked)} in the vault for ${name}.`
    ],
    seed
  );
}

/** Secondary color line: standings drama and running gags from this game. */
function colorLine(game: GameState, seed: number): string | null {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  const leader = sorted[0];
  const second = sorted[1];
  if (!leader || !second) return null;

  const farkleCounts = new Map<string, number>();
  for (const t of game.history) {
    if (t.farkled) farkleCounts.set(t.playerId, (farkleCounts.get(t.playerId) ?? 0) + 1);
  }
  const [unluckyId, unluckyCount] =
    [...farkleCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const unlucky = game.players.find((p) => p.id === unluckyId);

  const options: string[] = [];
  if (leader.score > 0 && leader.score - second.score >= 2500) {
    options.push(
      `😱 ${leader.name} leads by ${fmt(leader.score - second.score)}. This is turning into a documentary.`
    );
  } else if (leader.score > 0 && leader.score - second.score <= 300) {
    options.push(
      `🍿 ${fmt(leader.score - second.score)} points between ${leader.name} and ${second.name}. Hold onto your drinks.`
    );
  }
  if (unlucky && unluckyCount >= 3) {
    options.push(
      `🎻 ${unlucky.name} has farkled ${unluckyCount} times tonight. The dice remember something we don't.`
    );
  }
  const last = sorted.at(-1);
  if (last && leader.score >= game.ruleset.winningScore * 0.7 && leader.score - last.score >= 4000) {
    options.push(`🙏 ${last.name} needs ${fmt(leader.score - last.score)}. Miracles have happened. Rarely.`);
  }
  if (options.length === 0) return null;
  return pick(options, seed);
}

export function commentary(game: GameState): Commentary {
  const seed = game.history.length + game.players.length;

  if (game.phase === "finished") {
    const winner = game.players.find((p) => p.id === game.winnerId);
    const runnerUp = [...game.players]
      .filter((p) => p.id !== game.winnerId)
      .sort((a, b) => b.score - a.score)[0];
    return {
      line: winner
        ? pick(
            [
              `🏆 ${winner.name} wins it with ${fmt(winner.score)}! Cue the confetti.`,
              `🏆 Ballgame! ${winner.name} takes it, ${fmt(winner.score)} points.`
            ],
            seed
          )
        : "🏆 Game over!",
      color: runnerUp
        ? `${runnerUp.name} would like the record to show the dice were clearly rigged.`
        : null
    };
  }

  const last = game.history.at(-1);
  if (!last) {
    return {
      line: `🎙️ Dice are out, crowd is ready. ${currentPlayer(game).name} rolls first!`,
      color: null
    };
  }

  const name = game.players.find((p) => p.id === last.playerId)?.name ?? "Someone";
  const line = last.farkled
    ? farkleLine(game, last, name, seed)
    : bankLine(game, last, name, seed);

  let color = colorLine(game, seed);
  if (game.phase === "finalRound") {
    const trigger = game.players.find((p) => p.id === game.finalRoundTriggeredBy);
    color = trigger
      ? `🚨 FINAL ROUND: ${trigger.name} sits at ${fmt(trigger.score)}. Everyone else gets one swing.`
      : color;
  }
  return { line, color };
}
