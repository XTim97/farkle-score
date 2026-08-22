import { useEffect, useMemo, useRef, useState } from "react";
import { APP_VERSION, PLAYERS_MIN } from "./constants";
import useFarkleGame from "./hooks/useFarkleGame";
import HomeScreen from "./components/HomeScreen";
import PlayerSelectScreen from "./components/PlayerSelectScreen";
import ArrangeOrderScreen from "./components/ArrangeOrderScreen";
import RollingFirstPlayerScreen from "./components/RollingFirstPlayerScreen";
import FirstPlayerMethodScreen from "./components/FirstPlayerMethodScreen";
import RollForFirstPlayerScreen from "./components/RollForFirstPlayerScreen";
import GameScreen from "./components/GameScreen";
import InstructionsScreen from "./components/InstructionsScreen";
import { supabase } from "./supabase";

const STATS_KEY = "farklePlayerStatisticsV1";
const PLAYER_COLORS = [
  "#facc15",
  "#38bdf8",
  "#f472b6",
  "#a3e635",
  "#fb923c",
  "#c084fc",
  "#2dd4bf",
  "#f87171"
];

const EMPTY_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  highestFinalScore: 0,
  farkles: 0,
  highestSingleTurn: 0,
  fullHouse: 0,
  fourOfAKind: 0,
  fiveOfAKind: 0,
  sixOfAKind: 0,
  threePairs: 0,
  fourOfAKindPlusPair: 0,
  twoTriplets: 0,
  smallStraight: 0,
  largeStraight: 0,
  colorIndex: 0
};

function readStatistics() {
  try {
    const stored = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function normalizeStats(stats = {}) {
  return { ...EMPTY_STATS, ...stats };
}

function hasAnyStatistics(stats) {
  const normalized = normalizeStats(stats);
  return (
    normalized.gamesPlayed > 0 ||
    normalized.gamesWon > 0 ||
    normalized.highestFinalScore > 0 ||
    normalized.farkles > 0 ||
    normalized.highestSingleTurn > 0 ||
    normalized.fullHouse > 0 ||
    normalized.fourOfAKind > 0 ||
    normalized.fiveOfAKind > 0 ||
    normalized.sixOfAKind > 0 ||
    normalized.threePairs > 0 ||
    normalized.fourOfAKindPlusPair > 0 ||
    normalized.twoTriplets > 0 ||
    normalized.smallStraight > 0 ||
    normalized.largeStraight > 0
  );
}

function combinationKey(label) {
  const text = String(label || "").toLowerCase().replace(/[–—]/g, "-");
  if (text.includes("full house")) return "fullHouse";
  if (text.includes("four of a kind") && text.includes("pair")) return "fourOfAKindPlusPair";
  if (text.includes("four of a kind")) return "fourOfAKind";
  if (text.includes("five of a kind")) return "fiveOfAKind";
  if (text.includes("six of a kind")) return "sixOfAKind";
  if (text.includes("three pairs")) return "threePairs";
  if (text.includes("two triplets")) return "twoTriplets";
  if (text.includes("small straight")) return "smallStraight";
  if (text.includes("large straight") || text.includes("1-6 straight") || text.includes("1–6 straight")) return "largeStraight";
  return null;
}

function rowToStats(row) {
  return {
    gamesPlayed: row.games_played ?? 0,
    gamesWon: row.games_won ?? 0,
    highestFinalScore: row.highest_final_score ?? 0,
    farkles: row.farkles ?? 0,
    highestSingleTurn: row.highest_single_turn ?? 0,
    fullHouse: row.full_house ?? 0,
    fourOfAKind: row.four_of_a_kind ?? 0,
    fiveOfAKind: row.five_of_a_kind ?? 0,
    sixOfAKind: row.six_of_a_kind ?? 0,
    threePairs: row.three_pairs ?? 0,
    fourOfAKindPlusPair: row.four_of_a_kind_plus_pair ?? 0,
    twoTriplets: row.two_triplets ?? 0,
    smallStraight: row.small_straight ?? 0,
    largeStraight: row.large_straight ?? 0,
    colorIndex: row.color_index ?? 0
  };
}

function StatisticsScreen({
  savedPlayers,
  statistics,
  syncLoading,
  syncMessage,
  onRefresh,
  onBack
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const availablePlayers = useMemo(
    () => [...new Set([...savedPlayers, ...Object.keys(statistics)])].sort((a, b) => a.localeCompare(b)),
    [savedPlayers, statistics]
  );

  if (selectedPlayer) {
    const stats = normalizeStats(statistics[selectedPlayer]);

    return (
      <section className="panel statistics-screen">
        <button type="button" className="secondary statistics-back" onClick={() => setSelectedPlayer(null)}>
          ← Back
        </button>
        <h1 className="statistics-player-name">{selectedPlayer}</h1>
        <div className="statistics-grid">
          <div className="stat-card"><span>Games Played</span><strong>{stats.gamesPlayed}</strong></div>
          <div className="stat-card"><span>Games Won</span><strong>{stats.gamesWon}</strong></div>
          <div className="stat-card"><span>Highest Final Score</span><strong>{stats.highestFinalScore.toLocaleString()}</strong></div>
          <div className="stat-card"><span>Farkles</span><strong>{stats.farkles}</strong></div>
          <div className="stat-card"><span>Highest Single-Turn Score</span><strong>{stats.highestSingleTurn.toLocaleString()}</strong></div>
          <div className="stat-card"><span>Full Houses</span><strong>{stats.fullHouse}</strong></div>
          <div className="stat-card"><span>Four of a Kind</span><strong>{stats.fourOfAKind}</strong></div>
          <div className="stat-card"><span>Five of a Kind</span><strong>{stats.fiveOfAKind}</strong></div>
          <div className="stat-card"><span>Six of a Kind</span><strong>{stats.sixOfAKind}</strong></div>
          <div className="stat-card"><span>Three Pairs</span><strong>{stats.threePairs}</strong></div>
          <div className="stat-card"><span>Four of a Kind + Pair</span><strong>{stats.fourOfAKindPlusPair}</strong></div>
          <div className="stat-card"><span>Two Triplets</span><strong>{stats.twoTriplets}</strong></div>
          <div className="stat-card"><span>Small Straights</span><strong>{stats.smallStraight}</strong></div>
          <div className="stat-card"><span>Large Straights</span><strong>{stats.largeStraight}</strong></div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel statistics-screen">
      <button type="button" className="secondary statistics-back" onClick={onBack}>← Back</button>
      <div className="statistics-heading-row">
        <div>
          <h1>Player Statistics</h1>
          <p className="statistics-help">Choose a player to view synchronized statistics.</p>
        </div>
        <div className="statistics-account-actions">
          <button type="button" className="secondary" onClick={onRefresh} disabled={syncLoading}>
            {syncLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      {syncMessage && <p className="statistics-sync-message">{syncMessage}</p>}
      <div className="statistics-player-list">
        {availablePlayers.length === 0 ? (
          <p className="empty-state">No player statistics yet.</p>
        ) : (
          availablePlayers.map((name) => (
            <button
              key={name}
              type="button"
              className="statistics-player-button"
              onClick={() => setSelectedPlayer(name)}
            >
              {name}
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default function App() {
  const { state, actions } = useFarkleGame();
  const {
    activePlayer,
    activePlayerIndex,
    currentTurnActions,
    currentTurnScore,
    finalRound,
    finalRoundStarter,
    gameOver,
    leader,
    newPlayerName,
    orderedSetupPlayers,
    players,
    savedPlayers,
    screen,
    selectedNames,
    starterMessage,
    rollingPlayerName
  } = state;

  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState(readStatistics);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const gameRecordedRef = useRef(false);

  function saveLocalStatistics(updater) {
    setStatistics((current) => {
      const next = updater(current);
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function updateLocalPlayerStats(playerName, updater, colorIndex = 0) {
    if (!playerName) return;
    saveLocalStatistics((current) => {
      const existing = normalizeStats(current[playerName]);
      return {
        ...current,
        [playerName]: updater({ ...existing, colorIndex })
      };
    });
  }

  async function callStatsRpc(playerName, delta = {}) {
    if (!playerName) return;

    const { error } = await supabase.rpc("update_farkle_player_stats", {
      p_player_name: playerName,
      p_games_played_delta: delta.gamesPlayed || 0,
      p_games_won_delta: delta.gamesWon || 0,
      p_farkles_delta: delta.farkles || 0,
      p_full_house_delta: delta.fullHouse || 0,
      p_four_of_a_kind_delta: delta.fourOfAKind || 0,
      p_five_of_a_kind_delta: delta.fiveOfAKind || 0,
      p_six_of_a_kind_delta: delta.sixOfAKind || 0,
      p_three_pairs_delta: delta.threePairs || 0,
      p_four_of_a_kind_plus_pair_delta: delta.fourOfAKindPlusPair || 0,
      p_two_triplets_delta: delta.twoTriplets || 0,
      p_small_straight_delta: delta.smallStraight || 0,
      p_large_straight_delta: delta.largeStraight || 0,
      p_highest_final_score: delta.highestFinalScore ?? null,
      p_highest_single_turn: delta.highestSingleTurn ?? null,
      p_color_index: delta.colorIndex ?? null
    });

    if (error) {
      console.error("Could not sync Farkle statistics:", error);
      setSyncMessage("Statistics were saved on this device, but cloud sync failed.");
    } else {
      setSyncMessage("Statistics synced.");
    }
  }

  async function loadCloudStatistics({ migrateMissingLocal = false } = {}) {
    setSyncLoading(true);
    setSyncMessage("Loading synchronized statistics...");

    const { data, error } = await supabase
      .from("farkle_player_stats")
      .select("player_name,games_played,games_won,highest_final_score,farkles,highest_single_turn,full_house,four_of_a_kind,five_of_a_kind,six_of_a_kind,three_pairs,four_of_a_kind_plus_pair,two_triplets,small_straight,large_straight,color_index")
      .order("player_name", { ascending: true });

    if (error) {
      console.error("Could not load Farkle statistics:", error);
      setSyncMessage("Could not load cloud statistics. Showing this device's saved copy.");
      setSyncLoading(false);
      return;
    }

    const cloudStats = {};
    (data || []).forEach((row) => {
      cloudStats[row.player_name] = rowToStats(row);
    });

    if (migrateMissingLocal) {
      const localStats = readStatistics();
      const missingEntries = Object.entries(localStats).filter(
        ([name, stats]) => !cloudStats[name] && hasAnyStatistics(stats)
      );

      for (const [name, rawStats] of missingEntries) {
        const stats = normalizeStats(rawStats);
        await callStatsRpc(name, stats);
      }

      if (missingEntries.length > 0) {
        setSyncLoading(false);
        await loadCloudStatistics({ migrateMissingLocal: false });
        return;
      }
    }

    setStatistics(cloudStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(cloudStats));
    setSyncMessage("Statistics are up to date across devices.");
    setSyncLoading(false);
  }

  useEffect(() => {
    void loadCloudStatistics({ migrateMissingLocal: true });
  }, []);

  function resetGameStatisticsGuard() {
    gameRecordedRef.current = false;
    setShowStatistics(false);
  }

  function handleStartNewGame() {
    resetGameStatisticsGuard();
    actions.startNewGame();
  }

  function handleSamePlayers() {
    resetGameStatisticsGuard();
    actions.startNewGameWithCurrentPlayers();
  }

  function handleEndTurn() {
    if (activePlayer) {
      const playerName = actions.getPlayerName(activePlayer, activePlayerIndex);
      const combinationCounts = {};
      currentTurnActions.forEach((action) => {
        const key = combinationKey(action?.label);
        if (key) combinationCounts[key] = (combinationCounts[key] || 0) + 1;
      });

      const delta = {
        ...combinationCounts,
        highestSingleTurn: currentTurnScore,
        colorIndex: activePlayerIndex % PLAYER_COLORS.length
      };

      updateLocalPlayerStats(
        playerName,
        (stats) => {
          const next = {
            ...stats,
            highestSingleTurn: Math.max(stats.highestSingleTurn, currentTurnScore)
          };
          Object.entries(combinationCounts).forEach(([key, count]) => {
            next[key] = (next[key] || 0) + count;
          });
          return next;
        },
        delta.colorIndex
      );

      void callStatsRpc(playerName, delta);
    }
    actions.endTurn();
  }

  function handleFarkle() {
    if (activePlayer) {
      const playerName = actions.getPlayerName(activePlayer, activePlayerIndex);
      const colorIndex = activePlayerIndex % PLAYER_COLORS.length;
      updateLocalPlayerStats(
        playerName,
        (stats) => ({ ...stats, farkles: stats.farkles + 1 }),
        colorIndex
      );
      void callStatsRpc(playerName, { farkles: 1, colorIndex });
    }
    actions.farkle();
  }

  useEffect(() => {
    if (!gameOver || !leader || gameRecordedRef.current || players.length === 0) return;
    gameRecordedRef.current = true;

    saveLocalStatistics((current) => {
      const next = { ...current };
      players.forEach((player, index) => {
        const name = actions.getPlayerName(player, index);
        const stats = normalizeStats(next[name]);
        const isWinner = player.id === leader.id;
        next[name] = {
          ...stats,
          gamesPlayed: stats.gamesPlayed + 1,
          gamesWon: stats.gamesWon + (isWinner ? 1 : 0),
          highestFinalScore: Math.max(stats.highestFinalScore, player.score || 0),
          colorIndex: index % PLAYER_COLORS.length
        };

        void callStatsRpc(name, {
          gamesPlayed: 1,
          gamesWon: isWinner ? 1 : 0,
          highestFinalScore: player.score || 0,
          colorIndex: index % PLAYER_COLORS.length
        });
      });
      return next;
    });
  }, [gameOver, leader, players]);

  return (
    <main className="app">
      {screen !== "home" && (
        <button
          type="button"
          className="secondary home-small"
          onClick={actions.goHome}
        >
          Home
        </button>
      )}

      {screen === "home" && showStatistics && (
        <StatisticsScreen
          savedPlayers={savedPlayers}
          statistics={statistics}
          syncLoading={syncLoading}
          syncMessage={syncMessage}
          onRefresh={() => loadCloudStatistics({ migrateMissingLocal: false })}
          onBack={() => setShowStatistics(false)}
        />
      )}

      {screen === "home" && !showStatistics && (
        <>
          <HomeScreen
            appVersion={APP_VERSION}
            onNewGame={handleStartNewGame}
            onInstructions={actions.showInstructions}
          />
          <div className="statistics-launch-wrap">
            <button
              type="button"
              className="secondary statistics-launch-button"
              onClick={() => setShowStatistics(true)}
            >
              Statistics
            </button>
          </div>
        </>
      )}

      {screen === "instructions" && (
        <InstructionsScreen onBack={actions.goHome} />
      )}

      {screen === "selectPlayers" && (
        <PlayerSelectScreen
          savedPlayers={savedPlayers}
          selectedNames={selectedNames}
          newPlayerName={newPlayerName}
          playersMin={PLAYERS_MIN}
          onToggleSavedPlayer={actions.toggleSavedPlayer}
          onRemoveSavedPlayer={actions.removeSavedPlayer}
          onNewPlayerNameChange={actions.setNewPlayerName}
          onAddSavedPlayer={actions.addSavedPlayer}
          onContinue={actions.continueToOrderSetup}
        />
      )}

      {screen === "arrangeOrder" && (
        <ArrangeOrderScreen
          starterMessage={starterMessage}
          orderedSetupPlayers={orderedSetupPlayers}
          getPlayerName={actions.getPlayerName}
          onReorderOrderPlayer={actions.reorderOrderPlayer}
          onBeginGame={actions.beginGame}
        />
      )}

      {screen === "firstPlayerMethod" && (
        <FirstPlayerMethodScreen
          onRollDice={actions.chooseRollForFirst}
          onRandomize={actions.chooseRandomFirst}
        />
      )}

      {screen === "rollForFirst" && (
        <RollForFirstPlayerScreen
          players={players}
          getPlayerName={actions.getPlayerName}
          onSelectWinner={actions.selectHighestRoller}
        />
      )}

      {screen === "rollingFirstPlayer" && (
        <RollingFirstPlayerScreen rollingPlayerName={rollingPlayerName} />
      )}

      {screen === "game" && activePlayer && (
        <GameScreen
          activePlayer={activePlayer}
          activePlayerIndex={activePlayerIndex}
          players={players}
          currentTurnScore={currentTurnScore}
          currentTurnActions={currentTurnActions}
          finalRound={finalRound}
          finalRoundStarter={finalRoundStarter}
          gameOver={gameOver}
          leader={leader}
          getPlayerName={actions.getPlayerName}
          onAddScoringAction={actions.addScoringAction}
          onEndTurn={handleEndTurn}
          onFarkle={handleFarkle}
          onUndo={actions.undo}
          onNewGame={handleStartNewGame}
          onSamePlayers={handleSamePlayers}
          onHome={actions.goHome}
        />
      )}
    </main>
  );
}
