import {
  bankTurn,
  createGame,
  DEFAULT_RULESET,
  EngineError,
  farkleTurn,
  scoreCombo,
  undoLast,
  type ComboKey,
  type GameState
} from "@farkle/engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveGame, type ApiPlayer } from "./api.js";
import ArrangeOrderScreen from "./components/ArrangeOrderScreen.js";
import GameScreen from "./components/GameScreen.js";
import HomeScreen from "./components/HomeScreen.js";
import InstructionsScreen from "./components/InstructionsScreen.js";
import PlayerSelectScreen from "./components/PlayerSelectScreen.js";
import WinnerScreen from "./components/WinnerScreen.js";

type Screen = "home" | "players" | "order" | "game" | "instructions";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [roster, setRoster] = useState<ApiPlayer[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const startedAtRef = useRef("");

  const startGame = useCallback((ordered: ApiPlayer[]) => {
    const first = Math.floor(Math.random() * ordered.length);
    setGame(
      createGame(
        ordered.map((p) => ({ id: String(p.id), name: p.name })),
        DEFAULT_RULESET,
        first
      )
    );
    setRoster(ordered);
    startedAtRef.current = new Date().toISOString();
    setSaveState("idle");
    setScreen("game");
  }, []);

  const apply = useCallback((fn: (g: GameState) => GameState) => {
    setGame((g) => {
      if (!g) return g;
      try {
        return fn(g);
      } catch (e) {
        if (e instanceof EngineError) return g; // buttons are disabled; belt and suspenders
        throw e;
      }
    });
  }, []);

  useEffect(() => {
    if (game?.phase === "finished" && saveState === "idle") {
      setSaveState("saved");
      saveGame(game, startedAtRef.current).catch(() => setSaveState("failed"));
    }
  }, [game, saveState]);

  if (screen === "home") {
    return (
      <HomeScreen
        onNewGame={() => setScreen("players")}
        onInstructions={() => setScreen("instructions")}
      />
    );
  }
  if (screen === "instructions") {
    return <InstructionsScreen onBack={() => setScreen("home")} />;
  }
  if (screen === "players") {
    return (
      <PlayerSelectScreen
        onBack={() => setScreen("home")}
        onContinue={(selected) => {
          setRoster(selected);
          setScreen("order");
        }}
      />
    );
  }
  if (screen === "order") {
    return (
      <ArrangeOrderScreen
        players={roster}
        onBack={() => setScreen("players")}
        onStart={startGame}
      />
    );
  }
  if (game?.phase === "finished") {
    return (
      <WinnerScreen
        game={game}
        saveState={saveState}
        onRematch={() => startGame(roster)}
        onNewPlayers={() => setScreen("players")}
        onHome={() => {
          setGame(null);
          setScreen("home");
        }}
      />
    );
  }
  if (game) {
    return (
      <GameScreen
        game={game}
        onScore={(key: ComboKey) => apply((g) => scoreCombo(g, key))}
        onUndo={() => apply(undoLast)}
        onFarkle={() => apply(farkleTurn)}
        onBank={() => apply(bankTurn)}
      />
    );
  }
  return null;
}
