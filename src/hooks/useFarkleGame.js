import { useMemo, useState } from "react";
import { PLAYERS_MIN, PLAYERS_MAX, WINNING_SCORE } from "../constants";
import {
  makePlayer,
  readSavedPlayers,
  writeSavedPlayers
} from "../utils/playerUtils";
import {
  getFinalRoundPlayerIds,
  getLeader,
  getOrderedPlayers,
  getPlayerName,
  getTurnScore
} from "../utils/gameHelpers";

const defaultFinalRound = {
  active: false,
  triggeredById: null,
  remainingIds: []
};

export default function useFarkleGame() {
  const [screen, setScreen] = useState("home");
  const [savedPlayers, setSavedPlayers] = useState(readSavedPlayers);
  const [selectedNames, setSelectedNames] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [players, setPlayers] = useState([]);
  const [turnOrder, setTurnOrder] = useState([]);
  const [starterMessage, setStarterMessage] = useState("");
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [turnActions, setTurnActions] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [finalRound, setFinalRound] = useState(defaultFinalRound);

  const activePlayer = players[activePlayerIndex];
  const leader = useMemo(() => getLeader(players), [players]);

  const currentTurnActions = activePlayer
    ? turnActions[activePlayer.id] || []
    : [];

  const currentTurnScore = getTurnScore(currentTurnActions);
  const orderedSetupPlayers = getOrderedPlayers(turnOrder, players);

  const finalRoundStarter = players.find(
    (player) => player.id === finalRound.triggeredById
  );

  function resetFinalRound() {
    setFinalRound(defaultFinalRound);
  }

  function resetGameState() {
    setPlayers([]);
    setTurnOrder([]);
    setTurnActions({});
    setGameOver(false);
    setActivePlayerIndex(0);
    resetFinalRound();
  }

  function goHome() {
    resetGameState();
    setScreen("home");
  }

  function startNewGame() {
    const stored = readSavedPlayers();

    setSavedPlayers(stored);
    setSelectedNames([]);
    setNewPlayerName("");
    resetGameState();
    setScreen("selectPlayers");
  }

  function toggleSavedPlayer(name) {
    setSelectedNames((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  function addSavedPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;

    const updated = writeSavedPlayers([...savedPlayers, name]);

    setSavedPlayers(updated);
    setSelectedNames((current) =>
      current.includes(name) ? current : [...current, name]
    );
    setNewPlayerName("");
  }

  function removeSavedPlayer(name) {
    const updated = writeSavedPlayers(
      savedPlayers.filter((item) => item !== name)
    );

    setSavedPlayers(updated);
    setSelectedNames((current) => current.filter((item) => item !== name));
  }

  function generatePlayers() {
    const generated = ["Player 1", "Player 2"];
    const updated = writeSavedPlayers([...savedPlayers, ...generated]);

    setSavedPlayers(updated);
    setSelectedNames(generated);
  }

  function continueToOrderSetup() {
    const names =
      selectedNames.length > 0 ? selectedNames : savedPlayers.slice(0, 2);

    if (names.length < PLAYERS_MIN) return;

    const gamePlayers = names
      .slice(0, PLAYERS_MAX)
      .map((name, index) => makePlayer(index, name));

    const saved = writeSavedPlayers([...savedPlayers, ...names]);
    const randomIndex = Math.floor(Math.random() * gamePlayers.length);
    const starter = gamePlayers[randomIndex];
    const remainingPlayers = gamePlayers.filter(
      (player) => player.id !== starter.id
    );

    setSavedPlayers(saved);
    setPlayers(gamePlayers);
    setTurnOrder([starter.id, ...remainingPlayers.map((player) => player.id)]);
    setStarterMessage(`${getPlayerName(starter, randomIndex)} starts!`);
    setActivePlayerIndex(0);
    setTurnActions({});
    setGameOver(false);
    resetFinalRound();
    setScreen("arrangeOrder");
  }

  function moveOrderPlayer(id, direction) {
    setTurnOrder((current) => {
      const index = current.indexOf(id);
      const nextIndex = index + direction;

      if (index <= 0 || nextIndex <= 0 || nextIndex >= current.length) {
        return current;
      }

      const updated = [...current];
      [updated[index], updated[nextIndex]] = [
        updated[nextIndex],
        updated[index]
      ];

      return updated;
    });
  }

  function beginGame() {
    const orderedPlayers = getOrderedPlayers(turnOrder, players);

    setPlayers(orderedPlayers);
    setActivePlayerIndex(0);
    setTurnActions({});
    setGameOver(false);
    resetFinalRound();
    setScreen("game");
  }

  function addScoringAction(action) {
    if (!activePlayer || gameOver) return;

    setTurnActions((current) => ({
      ...current,
      [activePlayer.id]: [...(current[activePlayer.id] || []), action]
    }));
  }

  function moveToPlayerById(id) {
    const nextIndex = players.findIndex((player) => player.id === id);

    if (nextIndex !== -1) {
      setActivePlayerIndex(nextIndex);
    }
  }

  function advanceTurnNormally() {
    setActivePlayerIndex((current) => (current + 1) % players.length);
  }

  function finishFinalRoundTurn() {
    const remainingAfterThisTurn = finalRound.remainingIds.filter(
      (id) => id !== activePlayer.id
    );

    if (remainingAfterThisTurn.length === 0) {
      setFinalRound((current) => ({
        ...current,
        remainingIds: []
      }));
      setGameOver(true);
      return;
    }

    setFinalRound((current) => ({
      ...current,
      remainingIds: remainingAfterThisTurn
    }));

    moveToPlayerById(remainingAfterThisTurn[0]);
  }

  function startFinalRound() {
    const remainingIds = getFinalRoundPlayerIds(players, activePlayerIndex);

    setFinalRound({
      active: true,
      triggeredById: activePlayer.id,
      remainingIds
    });

    if (remainingIds.length === 0) {
      setGameOver(true);
      return;
    }

    moveToPlayerById(remainingIds[0]);
  }

  function recordScoredTurn(points, actions) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === activePlayer.id
          ? {
              ...player,
              score: player.score + points,
              history: [
                ...player.history,
                {
                  type: "score",
                  points,
                  actions
                }
              ]
            }
          : player
      )
    );
  }

  function clearActiveTurnActions() {
    setTurnActions((current) => ({
      ...current,
      [activePlayer.id]: []
    }));
  }

  function endTurn() {
    if (!activePlayer || gameOver) return;

    const points = currentTurnScore;
    const actions = [...currentTurnActions];
    const newTotalScore = activePlayer.score + points;
    const shouldStartFinalRound =
      !finalRound.active && newTotalScore >= WINNING_SCORE;

    recordScoredTurn(points, actions);
    clearActiveTurnActions();

    if (shouldStartFinalRound) {
      startFinalRound();
      return;
    }

    if (finalRound.active) {
      finishFinalRoundTurn();
      return;
    }

    advanceTurnNormally();
  }

  function farkle() {
    if (!activePlayer || gameOver) return;

    setPlayers((current) =>
      current.map((player) =>
        player.id === activePlayer.id
          ? {
              ...player,
              history: [
                ...player.history,
                {
                  type: "farkle",
                  points: 0,
                  actions: []
                }
              ]
            }
          : player
      )
    );

    clearActiveTurnActions();

    if (finalRound.active) {
      finishFinalRoundTurn();
      return;
    }

    advanceTurnNormally();
  }

  function undo() {
    if (!activePlayer || gameOver) return;

    const actions = turnActions[activePlayer.id] || [];
    if (actions.length === 0) return;

    setTurnActions((current) => ({
      ...current,
      [activePlayer.id]: actions.slice(0, -1)
    }));
  }

  return {
    state: {
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
      starterMessage
    },
    actions: {
      addSavedPlayer,
      addScoringAction,
      beginGame,
      continueToOrderSetup,
      farkle,
      generatePlayers,
      getPlayerName,
      goHome,
      moveOrderPlayer,
      removeSavedPlayer,
      setNewPlayerName,
      startNewGame,
      toggleSavedPlayer,
      undo,
      endTurn
    }
  };
}
