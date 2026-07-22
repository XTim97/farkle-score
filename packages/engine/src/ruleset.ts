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
  comboPoints: Record<ComboKey, number>;
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
