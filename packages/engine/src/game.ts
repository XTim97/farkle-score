import { comboByKey, type ComboKey } from "./combos.js";
import { EngineError } from "./errors.js";
import type { Ruleset } from "./ruleset.js";

export type GamePhase = "playing" | "finalRound" | "finished";

export interface TurnEvent {
  comboKey: ComboKey;
  points: number;
  diceUsed: number;
}

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  /** Has met the entry threshold (always true when the rule is off). */
  onBoard: boolean;
  consecutiveFarkles: number;
}

export interface CompletedTurn {
  playerId: string;
  turnNumber: number;
  events: TurnEvent[];
  banked: number;
  farkled: boolean;
  /** Points deducted this turn by the three-farkle penalty (positive number). */
  penalty: number;
}

export interface GameState {
  ruleset: Ruleset;
  players: PlayerState[];
  currentPlayerIndex: number;
  turnEvents: TurnEvent[];
  history: CompletedTurn[];
  phase: GamePhase;
  finalRoundTriggeredBy: string | null;
  finalTurnsRemaining: number;
  winnerId: string | null;
}

export interface TurnDerived {
  turnScore: number;
  diceRemaining: number;
  /** Times all six dice scored this turn and rolled again. */
  hotDiceCount: number;
}

export const DICE_PER_TURN = 6;

export function createGame(
  players: Array<{ id: string; name: string }>,
  ruleset: Ruleset,
  firstPlayerIndex = 0
): GameState {
  if (players.length < 2) {
    throw new EngineError("INVALID_PLAYERS", "A game needs at least two players");
  }
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) {
    throw new EngineError("INVALID_PLAYERS", "Player ids must be unique");
  }
  if (firstPlayerIndex < 0 || firstPlayerIndex >= players.length) {
    throw new EngineError("INVALID_PLAYERS", "First player index out of range");
  }
  return {
    ruleset,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      score: 0,
      onBoard: ruleset.entryThreshold === 0,
      consecutiveFarkles: 0
    })),
    currentPlayerIndex: firstPlayerIndex,
    turnEvents: [],
    history: [],
    phase: "playing",
    finalRoundTriggeredBy: null,
    finalTurnsRemaining: 0,
    winnerId: null
  };
}

export function currentPlayer(state: GameState): PlayerState {
  const player = state.players[state.currentPlayerIndex];
  if (!player) throw new EngineError("INVALID_PLAYERS", "Current player index out of range");
  return player;
}

/**
 * Fold the current turn's events into score and dice remaining.
 * Dice budget starts at 6; each combo consumes its dice. Reaching exactly 0
 * with hot dice enabled resets the budget to 6 (same turn keeps building).
 */
export function turnDerived(state: GameState): TurnDerived {
  let diceRemaining = DICE_PER_TURN;
  let turnScore = 0;
  let hotDiceCount = 0;
  for (const event of state.turnEvents) {
    diceRemaining -= event.diceUsed;
    turnScore += event.points;
    if (diceRemaining === 0 && state.ruleset.hotDice) {
      diceRemaining = DICE_PER_TURN;
      hotDiceCount += 1;
    }
  }
  return { turnScore, diceRemaining, hotDiceCount };
}

export function canScoreCombo(state: GameState, key: ComboKey): boolean {
  if (state.phase === "finished") return false;
  const points = state.ruleset.comboPoints[key];
  const combo = comboByKey.get(key);
  if (points == null || !combo) return false;
  return combo.diceUsed <= turnDerived(state).diceRemaining;
}

export function scoreCombo(state: GameState, key: ComboKey): GameState {
  if (state.phase === "finished") {
    throw new EngineError("GAME_FINISHED", "The game is over");
  }
  const points = state.ruleset.comboPoints[key];
  const combo = comboByKey.get(key);
  if (points == null || !combo) {
    throw new EngineError("COMBO_DISABLED", `Combo ${key} is not enabled in this ruleset`);
  }
  const { diceRemaining } = turnDerived(state);
  if (combo.diceUsed > diceRemaining) {
    throw new EngineError(
      "NOT_ENOUGH_DICE",
      `${combo.label} needs ${combo.diceUsed} dice but only ${diceRemaining} remain`
    );
  }
  const next = structuredClone(state);
  next.turnEvents.push({ comboKey: key, points, diceUsed: combo.diceUsed });
  return next;
}

export function canUndo(state: GameState): boolean {
  return state.phase !== "finished" && state.turnEvents.length > 0;
}

export function undoLast(state: GameState): GameState {
  if (!canUndo(state)) {
    throw new EngineError("NOTHING_TO_UNDO", "No scoring selection to undo this turn");
  }
  const next = structuredClone(state);
  next.turnEvents.pop();
  return next;
}

export function canBank(state: GameState): boolean {
  if (state.phase === "finished") return false;
  const { turnScore } = turnDerived(state);
  if (turnScore <= 0) return false;
  const player = currentPlayer(state);
  return player.onBoard || turnScore >= state.ruleset.entryThreshold;
}

export function bankTurn(state: GameState): GameState {
  if (state.phase === "finished") {
    throw new EngineError("GAME_FINISHED", "The game is over");
  }
  const { turnScore } = turnDerived(state);
  if (turnScore <= 0) {
    throw new EngineError("NOTHING_TO_BANK", "Score at least one combo before ending the turn");
  }
  const player = currentPlayer(state);
  if (!player.onBoard && turnScore < state.ruleset.entryThreshold) {
    throw new EngineError(
      "BELOW_ENTRY_THRESHOLD",
      `First banked turn must be at least ${state.ruleset.entryThreshold}`
    );
  }

  const next = structuredClone(state);
  const p = currentPlayer(next);
  p.score += turnScore;
  p.onBoard = true;
  p.consecutiveFarkles = 0;
  next.history.push({
    playerId: p.id,
    turnNumber: next.history.length + 1,
    events: next.turnEvents,
    banked: turnScore,
    farkled: false,
    penalty: 0
  });

  if (next.phase === "playing" && p.score >= next.ruleset.winningScore) {
    if (next.ruleset.finalRound) {
      next.phase = "finalRound";
      next.finalRoundTriggeredBy = p.id;
      next.finalTurnsRemaining = next.players.length - 1;
    } else {
      return finishGame(next);
    }
  } else if (next.phase === "finalRound") {
    next.finalTurnsRemaining -= 1;
    if (next.finalTurnsRemaining <= 0) return finishGame(next);
  }
  return advanceTurn(next);
}

export function farkleTurn(state: GameState): GameState {
  if (state.phase === "finished") {
    throw new EngineError("GAME_FINISHED", "The game is over");
  }
  const next = structuredClone(state);
  const p = currentPlayer(next);
  p.consecutiveFarkles += 1;

  let penalty = 0;
  if (next.ruleset.threeFarklePenalty > 0 && p.consecutiveFarkles === 3) {
    penalty = next.ruleset.threeFarklePenalty;
    p.score = Math.max(0, p.score - penalty);
    p.consecutiveFarkles = 0;
  }
  next.history.push({
    playerId: p.id,
    turnNumber: next.history.length + 1,
    events: next.turnEvents,
    banked: 0,
    farkled: true,
    penalty
  });

  if (next.phase === "finalRound") {
    next.finalTurnsRemaining -= 1;
    if (next.finalTurnsRemaining <= 0) return finishGame(next);
  }
  return advanceTurn(next);
}

function advanceTurn(state: GameState): GameState {
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnEvents = [];
  return state;
}

/** Highest total wins; ties break toward the earlier seat. */
function finishGame(state: GameState): GameState {
  state.phase = "finished";
  state.turnEvents = [];
  let winner = state.players[0];
  for (const player of state.players) {
    if (winner && player.score > winner.score) winner = player;
  }
  state.winnerId = winner?.id ?? null;
  return state;
}
