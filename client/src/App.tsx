import {
  bankTurn,
  createGame,
  DEFAULT_RULESET,
  EngineError,
  farkleTurn,
  rollAgain,
  scoreCombo,
  undoLast,
  type ComboKey,
  type GameState,
  type Ruleset
} from "@farkle/engine";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLiveSession,
  pushLiveState,
  saveGame,
  type ApiPlayer,
  type ApiRuleset
} from "./api.js";
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
import WatchJoinScreen from "./components/WatchJoinScreen.js";
import WatchScreen from "./components/WatchScreen.js";
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
  | "game-detail"
  | "watch-join"
  | "watch-live";

const initialWatchCode =
  /^#watch=([A-Za-z0-9]+)$/.exec(location.hash)?.[1]?.toUpperCase() ?? null;

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialWatchCode ? "watch-live" : "home");
  const [watchCode, setWatchCode] = useState<string | null>(initialWatchCode);
  const [liveCode, setLiveCode] = useState<string | null>(null);
  const [roster, setRoster] = useState<ApiPlayer[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const [editingRuleset, setEditingRuleset] = useState<ApiRuleset | null>(null);
  const [openGameId, setOpenGameId] = useState<number | null>(null);
  const startedAtRef = useRef("");
  const rulesetRef = useRef<Ruleset>(DEFAULT_RULESET);

  const startGame = useCallback((ordered: ApiPlayer[], ruleset?: Ruleset, firstIndex?: number) => {
    const rules = ruleset ?? rulesetRef.current;
    rulesetRef.current = rules;
    const first = firstIndex ?? Math.floor(Math.random() * ordered.length);
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
    // One live session per table; a rematch reuses the code so viewers stay tuned.
    setLiveCode((code) => {
      if (!code) {
        createLiveSession()
          .then((r) => setLiveCode(r.code))
          .catch(() => undefined);
      }
      return code;
    });
  }, []);

  useEffect(() => {
    if (game && liveCode) {
      pushLiveState(liveCode, game).catch(() => undefined);
    }
  }, [game, liveCode]);

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
        onWatch={() => setScreen("watch-join")}
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
  if (screen === "watch-join") {
    return (
      <WatchJoinScreen
        onBack={() => setScreen("home")}
        onJoin={(code) => {
          setWatchCode(code);
          history.replaceState(null, "", `#watch=${code}`);
          setScreen("watch-live");
        }}
      />
    );
  }
  if (screen === "watch-live" && watchCode) {
    return (
      <WatchScreen
        code={watchCode}
        onExit={() => {
          history.replaceState(null, "", location.pathname);
          setWatchCode(null);
          setScreen("home");
        }}
      />
    );
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
        onStart={(ordered, ruleset, firstIndex) => startGame(ordered, ruleset, firstIndex)}
      />
    );
  }
  if (game?.phase === "finished") {
    return (
      <WinnerScreen
        game={game}
        saveState={saveState}
        onRematch={() => setScreen("order")}
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
        liveCode={liveCode}
        onScore={(key: ComboKey) => apply((g) => scoreCombo(g, key))}
        onRoll={() => apply(rollAgain)}
        onUndo={() => apply(undoLast)}
        onFarkle={() => apply(farkleTurn)}
        onBank={() => apply(bankTurn)}
      />
    );
  }
  return null;
}
