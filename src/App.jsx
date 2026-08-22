import { useEffect, useRef, useState } from "react";
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

const STATS_KEY = "farklePlayerStatisticsV1";
const PLAYER_COLORS = [
  "#facc15", // yellow
  "#38bdf8", // sky blue
  "#f472b6", // pink
  "#a3e635", // lime
  "#fb923c", // orange
  "#c084fc", // violet
  "#2dd4bf", // teal
  "#f87171"  // coral
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

function StatisticsScreen({ savedPlayers, statistics, onBack }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  if (selectedPlayer) {
    const stats = normalizeStats(statistics[selectedPlayer]);
    const color = PLAYER_COLORS[stats.colorIndex % PLAYER_COLORS.length];

    return (
      <section className="panel statistics-screen" style={{ "--player-stat-color": color }}>
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
      <h1>Player Statistics</h1>
      <p className="statistics-help">Choose a player to view statistics.</p>
      <div className="statistics-player-list">
        {savedPlayers.length === 0 ? (
          <p className="empty-state">No saved players yet.</p>
        ) : (
          savedPlayers.map((name, index) => {
            const stats = normalizeStats(statistics[name]);
            const colorIndex = Number.isInteger(stats.colorIndex) ? stats.colorIndex : index;
            const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
            return (
              <button
                key={name}
                type="button"
                className="statistics-player-button"
                style={{ "--player-stat-color": color }}
                onClick={() => setSelectedPlayer(name)}
              >
                {name}
              </button>
            );
          })
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
  const gameRecordedRef = useRef(false);

  function saveStatistics(updater) {
    setStatistics((current) => {
      const next = updater(current);
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function updatePlayerStats(playerName, updater, colorIndex = 0) {
    if (!playerName) return;
    saveStatistics((current) => {
      const existing = normalizeStats(current[playerName]);
      return {
        ...current,
        [playerName]: updater({ ...existing, colorIndex })
      };
    });
  }

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

      updatePlayerStats(
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
        activePlayerIndex % PLAYER_COLORS.length
      );
    }
    actions.endTurn();
  }

  function handleFarkle() {
    if (activePlayer) {
      const playerName = actions.getPlayerName(activePlayer, activePlayerIndex);
      updatePlayerStats(
        playerName,
        (stats) => ({ ...stats, farkles: stats.farkles + 1 }),
        activePlayerIndex % PLAYER_COLORS.length
      );
    }
    actions.farkle();
  }

  useEffect(() => {
    if (!gameOver || !leader || gameRecordedRef.current || players.length === 0) return;
    gameRecordedRef.current = true;

    saveStatistics((current) => {
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
      });
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
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
