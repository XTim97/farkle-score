import { describe, expect, it } from "vitest";
import { COMBOS, comboByKey, DEFAULT_RULESET } from "../src/index.js";

describe("combo table", () => {
  it("has 17 combos with unique keys", () => {
    expect(COMBOS).toHaveLength(17);
    expect(comboByKey.size).toBe(17);
  });

  it("every combo consumes between 1 and 6 dice and scores positive points", () => {
    for (const combo of COMBOS) {
      expect(combo.diceUsed).toBeGreaterThanOrEqual(1);
      expect(combo.diceUsed).toBeLessThanOrEqual(6);
      expect(combo.points).toBeGreaterThan(0);
    }
  });

  it("matches the v1.2.18 house scoring values", () => {
    expect(comboByKey.get("single1")?.points).toBe(100);
    expect(comboByKey.get("triple1")?.points).toBe(300);
    expect(comboByKey.get("fullHouse")?.points).toBe(850);
    expect(comboByKey.get("smallStraight")?.points).toBe(850);
    expect(comboByKey.get("largeStraight")?.points).toBe(1500);
  });
});

describe("default ruleset", () => {
  it("plays to 10,000 with hot dice and a final round", () => {
    expect(DEFAULT_RULESET.winningScore).toBe(10000);
    expect(DEFAULT_RULESET.hotDice).toBe(true);
    expect(DEFAULT_RULESET.finalRound).toBe(true);
  });

  it("enables every combo at table point values", () => {
    for (const combo of COMBOS) {
      expect(DEFAULT_RULESET.comboPoints[combo.key]).toBe(combo.points);
    }
  });
});
