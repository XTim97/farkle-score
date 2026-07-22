import { describe, expect, it } from "vitest";
import { DEFAULT_RULESET, validateRuleset, type Ruleset } from "../src/index.js";

function withRules(overrides: Partial<Ruleset>): Ruleset {
  return { ...DEFAULT_RULESET, ...overrides };
}

describe("validateRuleset", () => {
  it("accepts the default ruleset", () => {
    expect(validateRuleset(DEFAULT_RULESET)).toEqual([]);
  });

  it("rejects blank names, low winning scores, negative amounts", () => {
    expect(validateRuleset(withRules({ name: "  " }))).toHaveLength(1);
    expect(validateRuleset(withRules({ winningScore: 500 }))).toHaveLength(1);
    expect(validateRuleset(withRules({ entryThreshold: -50 }))).toHaveLength(1);
    expect(validateRuleset(withRules({ threeFarklePenalty: -1 }))).toHaveLength(1);
  });

  it("rejects an empty combo table and non-positive combo points", () => {
    expect(validateRuleset(withRules({ comboPoints: {} }))).toHaveLength(1);
    expect(
      validateRuleset(withRules({ comboPoints: { single1: 0 } }))
    ).toHaveLength(1);
    expect(
      validateRuleset(withRules({ comboPoints: { single1: 100.5 } }))
    ).toHaveLength(1);
  });
});
