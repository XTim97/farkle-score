import type { ComboKey } from "./combos.js";
import type { CompletedEvent } from "./game.js";
import { computeOdds, countVectors, multinomialWeight, usagesForCombo } from "./odds.js";
import type { Ruleset } from "./ruleset.js";

type Counts = number[];

/** Can every combo in `keys` be taken from these face counts using disjoint dice? */
function canEmbed(counts: Counts, keys: ComboKey[], index = 0): boolean {
  if (index >= keys.length) return true;
  for (const usage of usagesForCombo(keys[index]!, counts)) {
    const remaining = counts.map((c, i) => c - (usage[i] ?? 0));
    if (canEmbed(remaining, keys, index + 1)) return true;
  }
  return false;
}

const setProbCache = new Map<string, number>();

/**
 * Exact probability that one roll of `diceCount` dice contains at least the
 * given combos on disjoint dice (e.g. a triple 5 AND a spare 1 together).
 * Enumerates face-count multisets with multinomial weights; memoized.
 */
export function comboSetProbability(diceCount: number, keys: ComboKey[]): number {
  if (keys.length === 0) return 1;
  const cacheKey = `${diceCount}|${[...keys].sort().join(",")}`;
  const cached = setProbCache.get(cacheKey);
  if (cached != null) return cached;

  // Most-constrained-first ordering keeps the embedding search shallow.
  const ordered = [...keys].sort(
    (a, b) => usagesLowerBound(b) - usagesLowerBound(a)
  );
  let p = 0;
  for (const counts of countVectors(diceCount)) {
    if (canEmbed(counts, ordered)) p += multinomialWeight(counts, diceCount);
  }
  setProbCache.set(cacheKey, p);
  return p;
}

function usagesLowerBound(key: ComboKey): number {
  if (key === "single1" || key === "single5") return 1;
  if (key.startsWith("triple")) return 3;
  if (key === "fourOfAKind") return 4;
  if (key === "fiveOfAKind" || key === "fullHouse" || key === "smallStraight") return 5;
  return 6;
}

/**
 * Exact likelihood of a recorded turn: the product over its rolls of the
 * probability of rolling at least the combos kept from that roll, times the
 * farkle probability of the fatal roll when the turn farkled. Rolls are
 * independent, so the product is the true joint probability.
 */
export function turnLikelihood(
  rolls: number[],
  events: Array<Pick<CompletedEvent, "comboKey" | "rollIndex">>,
  farkled: boolean,
  ruleset: Ruleset
): number {
  let p = 1;
  for (const [i, diceCount] of rolls.entries()) {
    const keys = events.filter((e) => e.rollIndex === i).map((e) => e.comboKey);
    if (keys.length > 0) {
      p *= comboSetProbability(diceCount, keys);
    } else if (farkled && i === rolls.length - 1) {
      p *= computeOdds(diceCount, ruleset).pFarkle;
    }
  }
  return p;
}
