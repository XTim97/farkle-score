import { comboByKey, type ComboKey } from "./combos.js";
import { EngineError } from "./errors.js";
import type { Ruleset } from "./ruleset.js";

export type GamePhase = "playing" | "finalRound" | "finished";

export interface TurnEvent {
  comboKey: ComboKey;
  points: number;
  diceUsed: number;
}

/** One physical roll within a turn: how many dice hit the table, what was kept. */
export interface TurnRoll {
  diceCount: number;
  events: TurnEvent[];
}

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  /** Has met the entry threshold (always true when the rule is off). */
  onBoard: boolean;
  consecutiveFarkles: number;
}

export interface CompletedEvent extends TurnEvent {
  rollIndex: number;
}

export interface CompletedTurn {
  playerId: string;
  turnNumber: number;
  events: CompletedEvent[];
  /** Dice count of each roll in order; a farkled turn ends with an eventless roll. */
  rolls: number[];
  banked: number;
  farkled: boolean;
  /** Points deducted this turn by the three-farkle penalty (positive number). */
  penalty: number;
}

export interface GameState {
  ruleset: Ruleset;
  players: PlayerState[];
  currentPlayerIndex: number;
  turnRolls: TurnRoll[];
  history: CompletedTurn[];
  phase: GamePhase;
  finalRoundTriggeredBy: string | null;
  finalTurnsRemaining: number;
  winnerId: string | null;
}

export interface TurnDerived {
  turnScore: number;
  /** Unscored dice still on the table from the current roll. */
  diceRemaining: number;
  /** Dice a re-roll would throw: the unscored dice, or all 6 on hot dice, 0 if locked. */
  nextRollDice: number;
  /** Times all six dice scored this turn and the budget reset (hot dice). */
  hotDiceCount: number;
}

export const DICE_PER_TURN = 6;

const freshTurn = (): TurnRoll[] => [{ diceCount: DICE_PER_TURN, events: [] }];

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
    turnRolls: freshTurn(),
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

function currentRoll(state: GameState): TurnRoll {
  const roll = state.turnRolls.at(-1);
  if (!roll) throw new EngineError("INVALID_PLAYERS", "Turn has no rolls");
  return roll;
}

export function turnDerived(state: GameState): TurnDerived {
  let turnScore = 0;
  let hotDiceCount = 0;
  for (const [i, roll] of state.turnRolls.entries()) {
    for (const event of roll.events) turnScore += event.points;
    // A mid-turn roll of all six dice can only mean the previous roll went hot.
    if (i > 0 && roll.diceCount === DICE_PER_TURN) hotDiceCount += 1;
  }
  const roll = currentRoll(state);
  const used = roll.events.reduce((sum, e) => sum + e.diceUsed, 0);
  const diceRemaining = roll.diceCount - used;
  const nextRollDice =
    diceRemaining > 0 ? diceRemaining : state.ruleset.hotDice ? DICE_PER_TURN : 0;
  return { turnScore, diceRemaining, nextRollDice, hotDiceCount };
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
      `${combo.label} needs ${combo.diceUsed} dice but only ${diceRemaining} remain in this roll`
    );
  }
  const next = structuredClone(state);
  const roll = currentRoll(next);
  roll.events.push({ comboKey: key, points, diceUsed: combo.diceUsed });
  // Hot dice: all six scored, so the only possible re-roll is all six. Open it
  // automatically; bankTurn discards it untouched if the player stops instead.
  const used = roll.events.reduce((sum, e) => sum + e.diceUsed, 0);
  if (roll.diceCount - used === 0 && next.ruleset.hotDice) {
    next.turnRolls.push({ diceCount: DICE_PER_TURN, events: [] });
  }
  return next;
}

export function canRollAgain(state: GameState): boolean {
  if (state.phase === "finished") return false;
  if (currentRoll(state).events.length === 0) return false;
  return turnDerived(state).nextRollDice > 0;
}

/** The player picks up the unscored dice (all six on hot dice) and rolls. */
export function rollAgain(state: GameState): GameState {
  if (!canRollAgain(state)) {
    throw new EngineError(
      "CANNOT_ROLL",
      "Keep at least one scoring combo from this roll before rolling again"
    );
  }
  const { nextRollDice } = turnDerived(state);
  const next = structuredClone(state);
  next.turnRolls.push({ diceCount: nextRollDice, events: [] });
  return next;
}

export function canUndo(state: GameState): boolean {
  if (state.phase === "finished") return false;
  return currentRoll(state).events.length > 0 || state.turnRolls.length > 1;
}

/** Undo the last action this turn: the last kept combo, or an empty re-roll. */
export function undoLast(state: GameState): GameState {
  if (!canUndo(state)) {
    throw new EngineError("NOTHING_TO_UNDO", "Nothing to undo this turn");
  }
  const next = structuredClone(state);
  const roll = currentRoll(next);
  if (roll.events.length > 0) {
    roll.events.pop();
    return next;
  }
  next.turnRolls.pop();
  // If the popped roll was the automatic hot-dice roll (previous roll fully
  // consumed), the user meant to undo the combo that triggered it: one tap.
  const prev = currentRoll(next);
  const used = prev.events.reduce((sum, e) => sum + e.diceUsed, 0);
  if (prev.diceCount - used === 0 && prev.events.length > 0) prev.events.pop();
  return next;
}

export function canBank(state: GameState): boolean {
  if (state.phase === "finished") return false;
  const { turnScore } = turnDerived(state);
  if (turnScore <= 0) return false;
  const player = currentPlayer(state);
  return player.onBoard || turnScore >= state.ruleset.entryThreshold;
}

function flattenEvents(rolls: TurnRoll[]): CompletedEvent[] {
  return rolls.flatMap((roll, rollIndex) =>
    roll.events.map((event) => ({ ...event, rollIndex }))
  );
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
  // A trailing eventless roll (the auto-opened hot-dice roll, or a stray
  // manual roll tap) was never actually thrown: banking discards it.
  if (next.turnRolls.length > 1 && currentRoll(next).events.length === 0) {
    next.turnRolls.pop();
  }
  next.history.push({
    playerId: p.id,
    turnNumber: next.history.length + 1,
    events: flattenEvents(next.turnRolls),
    rolls: next.turnRolls.map((r) => r.diceCount),
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

export function canFarkle(state: GameState): boolean {
  // A farkle is a roll with nothing scorable; once dice are kept from the
  // current roll it is no longer a farkle (roll again first).
  return state.phase !== "finished" && currentRoll(state).events.length === 0;
}

export function farkleTurn(state: GameState): GameState {
  if (state.phase === "finished") {
    throw new EngineError("GAME_FINISHED", "The game is over");
  }
  if (!canFarkle(state)) {
    throw new EngineError(
      "INVALID_FARKLE",
      "Dice were kept from this roll; roll again before a farkle can happen"
    );
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
    events: flattenEvents(next.turnRolls),
    rolls: next.turnRolls.map((r) => r.diceCount),
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
  state.turnRolls = freshTurn();
  return state;
}

/** Highest total wins; ties break toward the earlier seat. */
function finishGame(state: GameState): GameState {
  state.phase = "finished";
  state.turnRolls = freshTurn();
  let winner = state.players[0];
  for (const player of state.players) {
    if (winner && player.score > winner.score) winner = player;
  }
  state.winnerId = winner?.id ?? null;
  return state;
}
