export type EngineErrorCode =
  | "GAME_FINISHED"
  | "COMBO_DISABLED"
  | "NOT_ENOUGH_DICE"
  | "NOTHING_TO_UNDO"
  | "NOTHING_TO_BANK"
  | "BELOW_ENTRY_THRESHOLD"
  | "INVALID_PLAYERS";

export class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string
  ) {
    super(message);
    this.name = "EngineError";
  }
}
