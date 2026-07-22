import { describe, expect, it } from "vitest";
import { comboSetProbability, DEFAULT_RULESET, turnLikelihood } from "../src/index.js";

describe("comboSetProbability exact values", () => {
  it("single 1 in six dice: 1 - (5/6)^6", () => {
    expect(comboSetProbability(6, ["single1"])).toBeCloseTo(1 - (5 / 6) ** 6, 12);
  });

  it("a specific triple in three dice: 1/216", () => {
    expect(comboSetProbability(3, ["triple2"])).toBeCloseTo(1 / 216, 12);
  });

  it("single 1 AND single 5 jointly in six dice (inclusion-exclusion)", () => {
    // 1 - 2*(5/6)^6 + (4/6)^6 = 19502/46656
    expect(comboSetProbability(6, ["single1", "single5"])).toBeCloseTo(19502 / 46656, 12);
  });

  it("four of a kind (any face) in four dice: 6/1296", () => {
    expect(comboSetProbability(4, ["fourOfAKind"])).toBeCloseTo(6 / 1296, 12);
  });

  it("large straight in six dice: 6!/6^6", () => {
    expect(comboSetProbability(6, ["largeStraight"])).toBeCloseTo(720 / 46656, 12);
  });

  it("joint demands disjoint dice: triple 1s plus a spare single 1 needs four 1s", () => {
    // P(at least four 1s in six dice)
    const p4 =
      [4, 5, 6].reduce(
        (sum, k) =>
          sum +
          (720 /
            (FACT[k]! * FACT[6 - k]!)) *
            (1 / 6) ** k *
            (5 / 6) ** (6 - k),
        0
      );
    expect(comboSetProbability(6, ["triple1", "single1"])).toBeCloseTo(p4, 12);
  });

  it("impossible sets are zero", () => {
    expect(comboSetProbability(3, ["fourOfAKind"])).toBe(0);
    expect(comboSetProbability(6, ["twoTriplets", "single1"])).toBe(0);
  });

  it("empty set is certain", () => {
    expect(comboSetProbability(6, [])).toBe(1);
  });
});

const FACT: Record<number, number> = { 0: 1, 1: 1, 2: 2, 3: 6, 4: 24, 5: 120, 6: 720 };

describe("turnLikelihood", () => {
  it("multiplies independent rolls", () => {
    // Roll 6: kept single1. Roll 5: kept single5.
    const p = turnLikelihood(
      [6, 5],
      [
        { comboKey: "single1", rollIndex: 0 },
        { comboKey: "single5", rollIndex: 1 }
      ],
      false,
      DEFAULT_RULESET
    );
    expect(p).toBeCloseTo((1 - (5 / 6) ** 6) * (1 - (5 / 6) ** 5), 12);
  });

  it("a farkled turn multiplies in the fatal roll's farkle probability", () => {
    // Kept single1 from six dice, re-rolled five, farkled: pFarkle(5) = 7.72%.
    const p = turnLikelihood(
      [6, 5],
      [{ comboKey: "single1", rollIndex: 0 }],
      true,
      DEFAULT_RULESET
    );
    const pFarkle5 = 0.07716049382716049;
    expect(p).toBeCloseTo((1 - (5 / 6) ** 6) * pFarkle5, 6);
  });

  it("combos kept together from one roll are a joint probability, not a product", () => {
    const joint = turnLikelihood(
      [6],
      [
        { comboKey: "triple5", rollIndex: 0 },
        { comboKey: "single1", rollIndex: 0 }
      ],
      false,
      DEFAULT_RULESET
    );
    const naive =
      comboSetProbability(6, ["triple5"]) * comboSetProbability(6, ["single1"]);
    expect(joint).toBeLessThan(naive); // joint availability is strictly harder
    expect(joint).toBeGreaterThan(0);
  });
});
