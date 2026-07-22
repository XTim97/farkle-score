import { describe, expect, it } from "vitest";
import {
  bankTurn,
  canBank,
  canScoreCombo,
  canUndo,
  createGame,
  currentPlayer,
  DEFAULT_RULESET,
  EngineError,
  farkleTurn,
  scoreCombo,
  turnDerived,
  undoLast,
  type GameState,
  type Ruleset
} from "../src/index.js";

const TWO = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" }
];
const THREE = [...TWO, { id: "c", name: "Cara" }];

function withRules(overrides: Partial<Ruleset>): Ruleset {
  return { ...DEFAULT_RULESET, ...overrides };
}

/** Bank exactly `points` for the current player using single 1s/5s across turns. */
function bankQuick(state: GameState, points: number): GameState {
  let s = state;
  let remaining = points;
  while (remaining >= 100) {
    s = scoreCombo(s, "single1");
    remaining -= 100;
  }
  while (remaining >= 50) {
    s = scoreCombo(s, "single5");
    remaining -= 50;
  }
  return bankTurn(s);
}

describe("createGame", () => {
  it("seats players in order with zero scores", () => {
    const g = createGame(THREE, DEFAULT_RULESET, 1);
    expect(g.players.map((p) => p.name)).toEqual(["Alice", "Bob", "Cara"]);
    expect(currentPlayer(g).name).toBe("Bob");
    expect(g.phase).toBe("playing");
  });

  it("rejects fewer than two players, duplicate ids, bad first index", () => {
    expect(() => createGame([TWO[0]!], DEFAULT_RULESET)).toThrow(EngineError);
    expect(() => createGame([TWO[0]!, TWO[0]!], DEFAULT_RULESET)).toThrow(EngineError);
    expect(() => createGame(TWO, DEFAULT_RULESET, 2)).toThrow(EngineError);
  });

  it("marks players on board immediately when entry threshold is off", () => {
    expect(createGame(TWO, DEFAULT_RULESET).players[0]?.onBoard).toBe(true);
    expect(
      createGame(TWO, withRules({ entryThreshold: 500 })).players[0]?.onBoard
    ).toBe(false);
  });
});

describe("scoring and dice tracking", () => {
  it("accumulates additive combos and consumes dice", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "fourOfAKind");
    g = scoreCombo(g, "single1");
    const d = turnDerived(g);
    expect(d.turnScore).toBe(1100);
    expect(d.diceRemaining).toBe(1);
  });

  it("blocks combos that need more dice than remain", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "triple2");
    expect(canScoreCombo(g, "largeStraight")).toBe(false);
    expect(() => scoreCombo(g, "smallStraight")).toThrow(EngineError);
    expect(canScoreCombo(g, "triple6")).toBe(true);
  });

  it("hot dice: scoring all six resets the budget and keeps the turn", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "largeStraight");
    const d = turnDerived(g);
    expect(d.diceRemaining).toBe(6);
    expect(d.hotDiceCount).toBe(1);
    g = scoreCombo(g, "sixOfAKind");
    expect(turnDerived(g).turnScore).toBe(1500 + 3000);
    expect(turnDerived(g).hotDiceCount).toBe(2);
  });

  it("hot dice off: zero dice locks further scoring", () => {
    let g = createGame(TWO, withRules({ hotDice: false }));
    g = scoreCombo(g, "threePairs");
    expect(turnDerived(g).diceRemaining).toBe(0);
    expect(canScoreCombo(g, "single5")).toBe(false);
    expect(canBank(g)).toBe(true);
  });

  it("rejects combos disabled in the ruleset", () => {
    const { fullHouse: _, ...rest } = DEFAULT_RULESET.comboPoints;
    const g = createGame(TWO, withRules({ comboPoints: rest }));
    expect(canScoreCombo(g, "fullHouse")).toBe(false);
    expect(() => scoreCombo(g, "fullHouse")).toThrow(EngineError);
  });

  it("uses ruleset point overrides, not the base table", () => {
    const g = createGame(
      TWO,
      withRules({ comboPoints: { ...DEFAULT_RULESET.comboPoints, triple1: 1000 } })
    );
    expect(turnDerived(scoreCombo(g, "triple1")).turnScore).toBe(1000);
  });
});

describe("undo", () => {
  it("removes only the latest selection", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "triple4");
    g = scoreCombo(g, "single5");
    g = undoLast(g);
    const d = turnDerived(g);
    expect(d.turnScore).toBe(400);
    expect(d.diceRemaining).toBe(3);
  });

  it("undo across a hot-dice boundary restores the pre-reset budget", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "largeStraight");
    g = scoreCombo(g, "single1");
    g = undoLast(g);
    g = undoLast(g);
    expect(turnDerived(g).diceRemaining).toBe(6);
    expect(turnDerived(g).turnScore).toBe(0);
    expect(canUndo(g)).toBe(false);
    expect(() => undoLast(g)).toThrow(EngineError);
  });
});

describe("banking", () => {
  it("banks the turn score, advances to the next player, resets the turn", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "triple5");
    g = bankTurn(g);
    expect(g.players[0]?.score).toBe(500);
    expect(currentPlayer(g).name).toBe("Bob");
    expect(g.turnEvents).toEqual([]);
    expect(g.history).toHaveLength(1);
    expect(g.history[0]).toMatchObject({ playerId: "a", banked: 500, farkled: false });
  });

  it("refuses to bank nothing", () => {
    const g = createGame(TWO, DEFAULT_RULESET);
    expect(canBank(g)).toBe(false);
    expect(() => bankTurn(g)).toThrow(EngineError);
  });

  it("enforces the entry threshold until the player is on the board", () => {
    let g = createGame(TWO, withRules({ entryThreshold: 500 }));
    g = scoreCombo(g, "single1");
    expect(canBank(g)).toBe(false);
    expect(() => bankTurn(g)).toThrow(EngineError);
    g = scoreCombo(g, "triple4");
    expect(canBank(g)).toBe(true);
    g = bankTurn(g);
    expect(g.players[0]?.onBoard).toBe(true);
    // Once on board, small banks are fine.
    g = bankQuick(g, 500); // Bob gets on board
    g = scoreCombo(g, "single5");
    expect(canBank(g)).toBe(true);
  });
});

describe("farkle", () => {
  it("scores nothing, keeps the events for the record, advances", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    g = scoreCombo(g, "single1");
    g = farkleTurn(g);
    expect(g.players[0]?.score).toBe(0);
    expect(g.players[0]?.consecutiveFarkles).toBe(1);
    expect(g.history[0]).toMatchObject({ farkled: true, banked: 0 });
    expect(g.history[0]?.events).toHaveLength(1);
    expect(currentPlayer(g).name).toBe("Bob");
  });

  it("three consecutive farkles cost the penalty and reset the count", () => {
    let g = createGame(TWO, withRules({ threeFarklePenalty: 1000 }));
    g = bankQuick(g, 2000); // Alice banks 2000
    for (let i = 0; i < 2; i += 1) {
      g = farkleTurn(g); // Bob
      g = farkleTurn(g); // Alice
    }
    expect(g.players[0]?.consecutiveFarkles).toBe(2);
    g = farkleTurn(g); // Bob's third
    expect(g.players[1]?.consecutiveFarkles).toBe(0);
    expect(g.history.at(-1)?.penalty).toBe(1000);
    g = farkleTurn(g); // Alice's third
    expect(g.players[0]?.score).toBe(1000); // 2000 - 1000
  });

  it("penalty never drops a score below zero", () => {
    let g = createGame(TWO, withRules({ threeFarklePenalty: 1000 }));
    for (let i = 0; i < 3; i += 1) {
      g = farkleTurn(g); // Alice
      g = bankQuick(g, 100); // Bob keeps the game moving
    }
    expect(g.players[0]?.score).toBe(0);
  });

  it("banking resets a farkle streak", () => {
    let g = createGame(TWO, withRules({ threeFarklePenalty: 1000 }));
    g = farkleTurn(g);
    g = farkleTurn(g);
    g = bankQuick(g, 100); // Alice banks, streak cleared
    expect(g.players[0]?.consecutiveFarkles).toBe(0);
  });
});

describe("final round and winning", () => {
  function aliceNearWin(): GameState {
    let g = createGame(THREE, DEFAULT_RULESET);
    g = bankQuick(g, 9900); // Alice
    g = bankQuick(g, 500); // Bob
    g = bankQuick(g, 500); // Cara
    return g;
  }

  it("crossing the winning score triggers the final round for everyone else", () => {
    let g = aliceNearWin();
    g = bankQuick(g, 200); // Alice hits 10,100
    expect(g.phase).toBe("finalRound");
    expect(g.finalRoundTriggeredBy).toBe("a");
    expect(g.finalTurnsRemaining).toBe(2);
    expect(g.winnerId).toBeNull();
  });

  it("highest total after the final round wins, even overtaking the trigger", () => {
    let g = aliceNearWin();
    g = bankQuick(g, 200); // Alice 10,100 -> final round
    g = farkleTurn(g); // Bob
    g = bankQuick(g, 9700); // Cara: 500 + 9,700 = 10,200
    expect(g.phase).toBe("finished");
    expect(g.winnerId).toBe("c");
  });

  it("trigger player wins when nobody overtakes", () => {
    let g = aliceNearWin();
    g = bankQuick(g, 200);
    g = farkleTurn(g); // Bob
    g = farkleTurn(g); // Cara
    expect(g.phase).toBe("finished");
    expect(g.winnerId).toBe("a");
    expect(() => scoreCombo(g, "single1")).toThrow(EngineError);
    expect(() => bankTurn(g)).toThrow(EngineError);
    expect(() => farkleTurn(g)).toThrow(EngineError);
  });

  it("final round off: first to the winning score ends the game immediately", () => {
    let g = createGame(TWO, withRules({ finalRound: false }));
    g = bankQuick(g, 10000);
    expect(g.phase).toBe("finished");
    expect(g.winnerId).toBe("a");
    expect(g.history).toHaveLength(1);
  });

  it("plays a clean full two-player game to completion", () => {
    let g = createGame(TWO, DEFAULT_RULESET);
    while (g.phase !== "finished") {
      g = scoreCombo(g, "sixOfAKind");
      g = bankTurn(g);
    }
    // 3000/turn: Alice banks 4 turns to 12,000, Bob's final turn makes 4 x 3000 = 12,000...
    // tie broken toward the earlier seat.
    expect(g.players[0]?.score).toBe(12000);
    expect(g.players[1]?.score).toBe(12000);
    expect(g.winnerId).toBe("a");
    expect(g.history).toHaveLength(8);
  });
});
