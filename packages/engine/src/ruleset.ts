import { COMBOS, type ComboKey } from "./combos.js";

export interface Ruleset {
  name: string;
  winningScore: number;
  /** Minimum first banked turn to get "on the board". 0 disables. */
  entryThreshold: number;
  /** Points lost after three consecutive farkles. 0 disables. */
  threeFarklePenalty: number;
  /** Scoring all 6 dice rolls all 6 again, same turn keeps building. */
  hotDice: boolean;
  /** Every player after the leader gets one final turn. */
  finalRound: boolean;
  /** Per-combo point overrides; combos absent from this map are disabled. */
  comboPoints: Partial<Record<ComboKey, number>>;
}

/** Returns human-readable problems; empty array means the ruleset is playable. */
export function validateRuleset(r: Ruleset): string[] {
  const errors: string[] = [];
  if (!r.name?.trim()) errors.push("Name is required");
  if (!Number.isInteger(r.winningScore) || r.winningScore < 1000) {
    errors.push("Winning score must be at least 1,000");
  }
  if (!Number.isInteger(r.entryThreshold) || r.entryThreshold < 0) {
    errors.push("Entry threshold cannot be negative");
  }
  if (!Number.isInteger(r.threeFarklePenalty) || r.threeFarklePenalty < 0) {
    errors.push("Three-farkle penalty cannot be negative");
  }
  const enabled = COMBOS.filter((c) => r.comboPoints[c.key] != null);
  if (enabled.length === 0) {
    errors.push("Enable at least one scoring combination");
  }
  for (const combo of enabled) {
    const points = r.comboPoints[combo.key]!;
    if (!Number.isInteger(points) || points <= 0) {
      errors.push(`${combo.label} points must be a positive whole number`);
    }
  }
  return errors;
}

export const DEFAULT_RULESET: Ruleset = {
  name: "House Rules",
  winningScore: 10000,
  entryThreshold: 0,
  threeFarklePenalty: 0,
  hotDice: true,
  finalRound: true,
  comboPoints: Object.fromEntries(
    COMBOS.map((c) => [c.key, c.points])
  ) as Record<ComboKey, number>
};
