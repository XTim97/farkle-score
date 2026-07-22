import {
  bankTurn,
  createGame,
  DEFAULT_RULESET,
  EngineError,
  farkleTurn,
  scoreCombo,
  undoLast,
  type ComboKey,
  type GameState,
  type Ruleset
} from "@farkle/engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveGame, type ApiPlayer, type ApiRuleset } from "./api.js";
import ArrangeOrderScreen from "./components/ArrangeOrderScreen.js";
import GameScreen from "./components/GameScreen.js";
import HomeScreen from "./components/HomeScreen.js";
import InstructionsScreen from "./components/InstructionsScreen.js";
import PlayerSelectScreen from "./components/PlayerSelectScreen.js";
import GameDetailScreen from "./components/GameDetailScreen.js";
import HistoryScreen from "./components/HistoryScreen.js";
import RulesetEditor from "./components/RulesetEditor.js";
import RulesetsScreen from "./components/RulesetsScreen.js";
import StatsScreen from "./components/StatsScreen.js";
import WinnerScreen from "./components/WinnerScreen.js";

type Screen =
  | "home"
  | "players"
  | "order"
  | "game"
  | "instructions"
  | "rulesets"
  | "ruleset-edit"
  | "stats"
  | "history"
  | "game-detail";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [roster, setRoster] = useState<ApiPlayer[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const [editingRuleset, setEditingRuleset] = useState<ApiRuleset | null>(null);
  const [openGameId, setOpenGameId] = useState<number | null>(null);
  const startedAtRef = useRef("");
  const rulesetRef = useRef<Ruleset>(DEFAULT_RULESET);

  const startGame = useCallback((ordered: ApiPlayer[], ruleset?: Ruleset) => {
    const rules = ruleset ?? rulesetRef.current;
    rulesetRef.current = rules;
    const first = Math.floor(Math.random() * ordered.length);
    setGame(
      createGame(
        ordered.map((p) => ({ id: String(p.id), name: p.name })),
        rules,
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
        onRulesets={() => setScreen("rulesets")}
        onStats={() => setScreen("stats")}
        onHistory={() => setScreen("history")}
      />
    );
  }
  if (screen === "instructions") {
    return <InstructionsScreen onBack={() => setScreen("home")} />;
  }
  if (screen === "rulesets") {
    return (
      <RulesetsScreen
        onBack={() => setScreen("home")}
        onEdit={(ruleset) => {
          setEditingRuleset(ruleset);
          setScreen("ruleset-edit");
        }}
      />
    );
  }
  if (screen === "ruleset-edit") {
    return <RulesetEditor editing={editingRuleset} onDone={() => setScreen("rulesets")} />;
  }
  if (screen === "stats") {
    return <StatsScreen onBack={() => setScreen("home")} />;
  }
  if (screen === "history") {
    return (
      <HistoryScreen
        onBack={() => setScreen("home")}
        onOpen={(gameId) => {
          setOpenGameId(gameId);
          setScreen("game-detail");
        }}
      />
    );
  }
  if (screen === "game-detail" && openGameId != null) {
    return <GameDetailScreen gameId={openGameId} onBack={() => setScreen("history")} />;
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
        onStart={(ordered, ruleset) => startGame(ordered, ruleset)}
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
