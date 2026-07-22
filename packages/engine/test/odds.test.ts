import { describe, expect, it } from "vitest";
import {
  bestScoreForCounts,
  computeOdds,
  DEFAULT_RULESET,
  rollVsBank,
  type Ruleset
} from "../src/index.js";

function withRules(overrides: Partial<Ruleset>): Ruleset {
  return { ...DEFAULT_RULESET, ...overrides };
}

// counts vector helper: c(1s, 2s, 3s, 4s, 5s, 6s)
const c = (...counts: number[]) => counts;

describe("computeOdds known exact values", () => {
  it("one die: farkle 4/6, singles 1/6 each, EV 25", () => {
    const odds = computeOdds(1, DEFAULT_RULESET);
    expect(odds.pFarkle).toBeCloseTo(4 / 6, 10);
    expect(odds.comboProbabilities.single1).toBeCloseTo(1 / 6, 10);
    expect(odds.comboProbabilities.single5).toBeCloseTo(1 / 6, 10);
    expect(odds.expectedRollScore).toBeCloseTo(25, 10);
  });

  it("two dice: farkle 16/36, EV 50, no three-dice combos listed", () => {
    const odds = computeOdds(2, DEFAULT_RULESET);
    expect(odds.pFarkle).toBeCloseTo(16 / 36, 10);
    expect(odds.expectedRollScore).toBeCloseTo(50, 10);
    expect(odds.comboProbabilities.triple1).toBeUndefined();
  });

  it("three dice: farkle 60/216, a specific triple is 1/216", () => {
    const odds = computeOdds(3, DEFAULT_RULESET);
    expect(odds.pFarkle).toBeCloseTo(60 / 216, 10);
    expect(odds.comboProbabilities.triple2).toBeCloseTo(1 / 216, 10);
    expect(odds.comboProbabilities.single1).toBeCloseTo(91 / 216, 10);
  });

  it("farkle risk falls strictly as dice increase", () => {
    let prev = 1;
    for (let n = 1; n <= 6; n += 1) {
      const { pFarkle } = computeOdds(n, DEFAULT_RULESET);
      expect(pFarkle).toBeLessThan(prev);
      prev = pFarkle;
    }
    expect(prev).toBeGreaterThan(0);
    expect(prev).toBeLessThan(0.03); // six dice with these combos
  });

  it("rejects out-of-range dice counts", () => {
    expect(() => computeOdds(0, DEFAULT_RULESET)).toThrow(RangeError);
    expect(() => computeOdds(7, DEFAULT_RULESET)).toThrow(RangeError);
  });

  it("disabled combos drop out of both odds and farkle definition", () => {
    const singlesOnly = withRules({ comboPoints: { single1: 100, single5: 50 } });
    const odds = computeOdds(3, singlesOnly);
    // Farkle now = no 1s and no 5s at all: (4/6)^3
    expect(odds.pFarkle).toBeCloseTo(64 / 216, 10);
    expect(odds.comboProbabilities.triple2).toBeUndefined();
  });
});

describe("bestScoreForCounts best-play maximization", () => {
  it("prefers two triplets over splitting into triples", () => {
    expect(bestScoreForCounts(c(3, 0, 0, 0, 3, 0), DEFAULT_RULESET)).toBe(2500);
  });

  it("falls back to full house + leftover single when two triplets is disabled", () => {
    const { twoTriplets: _, ...rest } = DEFAULT_RULESET.comboPoints;
    const rules = withRules({ comboPoints: rest });
    // 1,1,1,5,5,5 -> full house (three 5s + pair of 1s) 850 + single 1 = 950
    expect(bestScoreForCounts(c(3, 0, 0, 0, 3, 0), rules)).toBe(950);
  });

  it("prefers four of a kind + pair over four of a kind plus loose singles", () => {
    expect(bestScoreForCounts(c(0, 0, 4, 0, 2, 0), DEFAULT_RULESET)).toBe(1500);
  });

  it("scores a large straight over a small straight plus scraps", () => {
    expect(bestScoreForCounts(c(1, 1, 1, 1, 1, 1), DEFAULT_RULESET)).toBe(1500);
  });

  it("takes a small straight over loose singles", () => {
    expect(bestScoreForCounts(c(1, 1, 1, 1, 1, 0), DEFAULT_RULESET)).toBe(850);
  });

  it("stacks singles on top of a triple", () => {
    // 2,2,2,1,5 -> triple 2s (200) + 100 + 50
    expect(bestScoreForCounts(c(1, 3, 0, 0, 1, 0), DEFAULT_RULESET)).toBe(350);
  });

  it("returns zero for a farkle roll", () => {
    expect(bestScoreForCounts(c(0, 2, 1, 2, 0, 1), DEFAULT_RULESET)).toBe(0);
  });
});

describe("rollVsBank", () => {
  it("favors rolling with nothing at stake, banking with a big turn on one die", () => {
    const one = computeOdds(1, DEFAULT_RULESET);
    expect(rollVsBank(one, 0)).toBeCloseTo(25, 10);
    expect(rollVsBank(one, 1000)).toBeLessThan(0);
  });

  it("six fresh dice justify rolling even a large turn score", () => {
    const six = computeOdds(6, DEFAULT_RULESET);
    expect(rollVsBank(six, 2000)).toBeGreaterThan(0);
  });
});
