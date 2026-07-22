import { describe, expect, it } from "vitest";
import {
  availableCombos,
  comboSetProbability,
  computeOdds,
  countVectors,
  DEFAULT_RULESET,
  multinomialWeight,
  usagesForCombo,
  type ComboKey
} from "../src/index.js";

/** Deterministic RNG so the Monte Carlo check is reproducible. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rollCounts(diceCount: number, rand: () => number): number[] {
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < diceCount; i += 1) {
    counts[Math.floor(rand() * 6)]! += 1;
  }
  return counts;
}

function canEmbed(counts: number[], keys: ComboKey[], index = 0): boolean {
  if (index >= keys.length) return true;
  for (const usage of usagesForCombo(keys[index]!, counts)) {
    const remaining = counts.map((c, i) => c - (usage[i] ?? 0));
    if (canEmbed(remaining, keys, index + 1)) return true;
  }
  return false;
}

describe("exhaustiveness identities", () => {
  it("outcome weights sum to exactly 1 for every dice count", () => {
    for (let n = 1; n <= 6; n += 1) {
      let total = 0;
      for (const counts of countVectors(n)) total += multinomialWeight(counts, n);
      expect(total).toBeCloseTo(1, 12);
    }
  });

  it("farkle probability is exactly the complement of any-combo-available", () => {
    for (let n = 1; n <= 6; n += 1) {
      let pScorable = 0;
      for (const counts of countVectors(n)) {
        if (availableCombos(counts, DEFAULT_RULESET).length > 0) {
          pScorable += multinomialWeight(counts, n);
        }
      }
      expect(computeOdds(n, DEFAULT_RULESET).pFarkle).toBeCloseTo(1 - pScorable, 12);
    }
  });

  it("adding a combo to a set never increases its probability", () => {
    expect(comboSetProbability(6, ["triple5", "single1"])).toBeLessThanOrEqual(
      comboSetProbability(6, ["triple5"])
    );
    expect(comboSetProbability(6, ["triple5"])).toBeLessThanOrEqual(1);
  });
});

describe("Monte Carlo cross-validation (300k seeded rolls)", () => {
  const N = 300_000;

  it("six-dice farkle frequency matches the exact 2.31%", () => {
    const rand = mulberry32(42);
    let farkles = 0;
    for (let i = 0; i < N; i += 1) {
      if (availableCombos(rollCounts(6, rand), DEFAULT_RULESET).length === 0) farkles += 1;
    }
    expect(farkles / N).toBeCloseTo(computeOdds(6, DEFAULT_RULESET).pFarkle, 2);
  });

  it("joint single 1 + single 5 frequency matches the exact enumeration", () => {
    const rand = mulberry32(7);
    const keys: ComboKey[] = ["single1", "single5"];
    let hits = 0;
    for (let i = 0; i < N; i += 1) {
      if (canEmbed(rollCounts(6, rand), keys)) hits += 1;
    }
    expect(hits / N).toBeCloseTo(comboSetProbability(6, keys), 2);
  });

  it("rare event (specific triple in three dice) matches 1/216", () => {
    const rand = mulberry32(1337);
    let hits = 0;
    for (let i = 0; i < N; i += 1) {
      if (canEmbed(rollCounts(3, rand), ["triple2"])) hits += 1;
    }
    const observed = hits / N;
    const exact = comboSetProbability(3, ["triple2"]);
    expect(Math.abs(observed - exact)).toBeLessThan(0.001);
  });

  it("hard joint case (triple 5s + spare 1 in six dice) matches enumeration", () => {
    const rand = mulberry32(99);
    const keys: ComboKey[] = ["triple5", "single1"];
    let hits = 0;
    for (let i = 0; i < N; i += 1) {
      if (canEmbed(rollCounts(6, rand), keys)) hits += 1;
    }
    expect(Math.abs(hits / N - comboSetProbability(6, keys))).toBeLessThan(0.002);
  });
});
