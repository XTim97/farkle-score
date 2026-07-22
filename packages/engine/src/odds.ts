import { comboByKey, type ComboKey } from "./combos.js";
import type { Ruleset } from "./ruleset.js";

/**
 * Exact next-roll odds for N dice under a ruleset. Enumerates face-count
 * vectors (at most 462 multisets for 6 dice) with multinomial weights,
 * so results are exact and always consistent with the active house rules.
 * Scope: the immediate next roll; it does not chain hypothetical hot-dice
 * re-rolls.
 */
export interface OddsResult {
  diceCount: number;
  /** Probability the roll contains no enabled scoring combo. */
  pFarkle: number;
  /** P(combo can be taken from the roll), per enabled combo that fits the dice count. */
  comboProbabilities: Partial<Record<ComboKey, number>>;
  /** E[best immediate score of the roll]; farkles count as 0. */
  expectedRollScore: number;
}

/** Face counts: counts[0] = number of 1s ... counts[5] = number of 6s. */
type Counts = number[];

function enabled(ruleset: Ruleset, key: ComboKey): boolean {
  return ruleset.comboPoints[key] != null;
}

function points(ruleset: Ruleset, key: ComboKey): number {
  return ruleset.comboPoints[key] ?? 0;
}

/** Which enabled combos are present in a roll with these face counts? */
export function availableCombos(counts: Counts, ruleset: Ruleset): ComboKey[] {
  const get = (face: number) => counts[face - 1] ?? 0;
  const found: ComboKey[] = [];
  const check = (key: ComboKey, present: boolean) => {
    if (present && enabled(ruleset, key)) found.push(key);
  };

  check("single1", get(1) >= 1);
  check("single5", get(5) >= 1);
  for (let face = 1; face <= 6; face += 1) {
    check(`triple${face}` as ComboKey, get(face) >= 3);
  }
  check("fourOfAKind", counts.some((c) => c >= 4));
  check("fiveOfAKind", counts.some((c) => c >= 5));
  check("sixOfAKind", counts.some((c) => c >= 6));
  check(
    "fullHouse",
    counts.some((c, i) => c >= 3 && counts.some((d, j) => j !== i && d >= 2))
  );
  check("threePairs", counts.filter((c) => c >= 2).length >= 3);
  check(
    "fourOfAKindPlusPair",
    counts.some((c, i) => c >= 4 && counts.some((d, j) => j !== i && d >= 2))
  );
  check("twoTriplets", counts.filter((c) => c >= 3).length >= 2);
  check(
    "smallStraight",
    [1, 2, 3, 4, 5].every((f) => get(f) >= 1) || [2, 3, 4, 5, 6].every((f) => get(f) >= 1)
  );
  check("largeStraight", counts.every((c) => c >= 1));
  return found;
}

/** Every way an enabled combo can consume faces from this roll. */
function comboApplications(
  counts: Counts,
  ruleset: Ruleset
): Array<{ key: ComboKey; usage: Counts }> {
  const apps: Array<{ key: ComboKey; usage: Counts }> = [];
  const use = (key: ComboKey, usage: Counts) => {
    if (enabled(ruleset, key)) apps.push({ key, usage });
  };
  const usageOf = (pairs: Array<[face: number, n: number]>): Counts => {
    const u = [0, 0, 0, 0, 0, 0];
    for (const [face, n] of pairs) u[face - 1] = n;
    return u;
  };
  const get = (face: number) => counts[face - 1] ?? 0;

  if (get(1) >= 1) use("single1", usageOf([[1, 1]]));
  if (get(5) >= 1) use("single5", usageOf([[5, 1]]));
  for (let f = 1; f <= 6; f += 1) {
    if (get(f) >= 3) use(`triple${f}` as ComboKey, usageOf([[f, 3]]));
    if (get(f) >= 4) use("fourOfAKind", usageOf([[f, 4]]));
    if (get(f) >= 5) use("fiveOfAKind", usageOf([[f, 5]]));
    if (get(f) >= 6) use("sixOfAKind", usageOf([[f, 6]]));
    for (let g = 1; g <= 6; g += 1) {
      if (g === f) continue;
      if (get(f) >= 3 && get(g) >= 2) {
        use(
          "fullHouse",
          usageOf([
            [f, 3],
            [g, 2]
          ])
        );
      }
      if (get(f) >= 4 && get(g) >= 2) {
        use(
          "fourOfAKindPlusPair",
          usageOf([
            [f, 4],
            [g, 2]
          ])
        );
      }
      if (g > f && get(f) >= 3 && get(g) >= 3) {
        use(
          "twoTriplets",
          usageOf([
            [f, 3],
            [g, 3]
          ])
        );
      }
    }
  }
  // Three distinct pairs (choose any 3 faces holding pairs).
  const pairFaces = [1, 2, 3, 4, 5, 6].filter((f) => get(f) >= 2);
  for (let i = 0; i < pairFaces.length; i += 1) {
    for (let j = i + 1; j < pairFaces.length; j += 1) {
      for (let k = j + 1; k < pairFaces.length; k += 1) {
        use(
          "threePairs",
          usageOf([
            [pairFaces[i]!, 2],
            [pairFaces[j]!, 2],
            [pairFaces[k]!, 2]
          ])
        );
      }
    }
  }
  for (const run of [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6]
  ]) {
    if (run.every((f) => get(f) >= 1)) {
      use("smallStraight", usageOf(run.map((f) => [f, 1])));
    }
  }
  if (counts.every((c) => c >= 1)) {
    use(
      "largeStraight",
      usageOf([1, 2, 3, 4, 5, 6].map((f) => [f, 1]))
    );
  }
  return apps;
}

/**
 * Maximum immediate score extractable from a roll: best set of disjoint
 * combo applications under the ruleset. Exported for tests and analytics.
 */
export function bestScoreForCounts(
  counts: Counts,
  ruleset: Ruleset,
  memo: Map<string, number> = new Map()
): number {
  const key = counts.join(",");
  const cached = memo.get(key);
  if (cached != null) return cached;

  let best = 0;
  for (const app of comboApplications(counts, ruleset)) {
    const remaining = counts.map((c, i) => c - (app.usage[i] ?? 0));
    const score = points(ruleset, app.key) + bestScoreForCounts(remaining, ruleset, memo);
    if (score > best) best = score;
  }
  memo.set(key, best);
  return best;
}

const FACTORIAL = [1, 1, 2, 6, 24, 120, 720];

function multinomialWeight(counts: Counts, diceCount: number): number {
  let denom = 1;
  for (const c of counts) denom *= FACTORIAL[c] ?? 1;
  return FACTORIAL[diceCount]! / denom / 6 ** diceCount;
}

/** Enumerate every face-count vector for `diceCount` dice. */
function* countVectors(diceCount: number): Generator<Counts> {
  const counts = [0, 0, 0, 0, 0, 0];
  function* place(face: number, remaining: number): Generator<Counts> {
    if (face === 5) {
      counts[5] = remaining;
      yield [...counts];
      return;
    }
    for (let n = 0; n <= remaining; n += 1) {
      counts[face] = n;
      yield* place(face + 1, remaining - n);
    }
  }
  yield* place(0, diceCount);
}

export function computeOdds(diceCount: number, ruleset: Ruleset): OddsResult {
  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 6) {
    throw new RangeError(`diceCount must be 1..6, got ${diceCount}`);
  }
  let pFarkle = 0;
  let expectedRollScore = 0;
  const comboProbabilities: Partial<Record<ComboKey, number>> = {};
  const memo = new Map<string, number>();

  for (const counts of countVectors(diceCount)) {
    const weight = multinomialWeight(counts, diceCount);
    const combos = availableCombos(counts, ruleset);
    if (combos.length === 0) {
      pFarkle += weight;
      continue;
    }
    for (const key of combos) {
      comboProbabilities[key] = (comboProbabilities[key] ?? 0) + weight;
    }
    expectedRollScore += weight * bestScoreForCounts(counts, ruleset, memo);
  }

  // Combos that fit the dice count but never appeared get an explicit 0 so
  // the UI can distinguish "possible but unrolled" from "impossible".
  for (const combo of comboByKey.values()) {
    if (enabled(ruleset, combo.key) && combo.diceUsed <= diceCount) {
      comboProbabilities[combo.key] ??= 0;
    }
  }

  return { diceCount, pFarkle, comboProbabilities, expectedRollScore };
}

/**
 * Expected net change in banked outcome from rolling once more with
 * `turnScore` at stake: expected roll gain minus expected loss of the
 * accumulated turn score to a farkle. Positive favors rolling.
 */
export function rollVsBank(odds: OddsResult, turnScore: number): number {
  return odds.expectedRollScore - odds.pFarkle * turnScore;
}
