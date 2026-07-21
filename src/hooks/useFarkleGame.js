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
  const [tableOrder, setTableOrder] = useState([]);
  const [starterMessage, setStarterMessage] = useState("");
  const [rollingPlayerName, setRollingPlayerName] = useState("");
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
    setTableOrder([]);
    setTurnActions({});
    setGameOver(false);
    setActivePlayerIndex(0);
    setRollingPlayerName("");
    resetFinalRound();
  }

  function goHome() {
    resetGameState();
    setScreen("home");
  }

  function getDefaultSelectedNames(names) {
    return names.length === PLAYERS_MIN ? names : [];
  }

  function showInstructions() {
    setScreen("instructions");
  }

  function startNewGame() {
    const stored = readSavedPlayers();

    setSavedPlayers(stored);
    setSelectedNames(getDefaultSelectedNames(stored));
    setNewPlayerName("");
    resetGameState();
    setScreen("selectPlayers");
  }

  function rotatePlayersFromStarter(tableOrderedPlayers, starterTableIndex) {
    const starter = tableOrderedPlayers[starterTableIndex] || null;
    const orderedPlayers = starter
      ? [
          ...tableOrderedPlayers.slice(starterTableIndex),
          ...tableOrderedPlayers.slice(0, starterTableIndex)
        ]
      : [];

    return { orderedPlayers, starter, starterTableIndex };
  }

  function finishRandomFirstPlayer(tableOrderedPlayers, starterTableIndex) {
    const { orderedPlayers, starter } = rotatePlayersFromStarter(
      tableOrderedPlayers,
      starterTableIndex
    );

    setTableOrder(tableOrderedPlayers.map((player) => player.id));
    setPlayers(orderedPlayers);
    setTurnOrder(orderedPlayers.map((player) => player.id));
    setStarterMessage(
      starter ? `${getPlayerName(starter, starterTableIndex)} starts!` : ""
    );
    setActivePlayerIndex(0);
    setTurnActions({});
    setGameOver(false);
    resetFinalRound();
    setScreen("game");
  }

  function randomizeFirstPlayerWithDelay(tableOrderedPlayers) {
    if (tableOrderedPlayers.length === 0) return;

    setScreen("rollingFirstPlayer");
    setRollingPlayerName("Choosing...");

    let ticks = 0;
    const maxTicks = 16;
    const finalStarterTableIndex = Math.floor(
      Math.random() * tableOrderedPlayers.length
    );

    const interval = window.setInterval(() => {
      const rollingIndex = Math.floor(Math.random() * tableOrderedPlayers.length);
      const rollingPlayer = tableOrderedPlayers[rollingIndex];

      setRollingPlayerName(getPlayerName(rollingPlayer, rollingIndex));
      ticks += 1;

      if (ticks >= maxTicks) {
        window.clearInterval(interval);
        const finalStarter = tableOrderedPlayers[finalStarterTableIndex];
        setRollingPlayerName(
          `${getPlayerName(finalStarter, finalStarterTableIndex)} starts!`
        );

        window.setTimeout(() => {
          finishRandomFirstPlayer(tableOrderedPlayers, finalStarterTableIndex);
        }, 700);
      }
    }, 120);
  }

  function startNewGameWithCurrentPlayers() {
    if (players.length < PLAYERS_MIN) {
      startNewGame();
      return;
    }

    const sourceOrder = tableOrder.length > 0 ? tableOrder : players.map((p) => p.id);
    const resetById = new Map(
      players.map((player, index) => [
        player.id,
        {
          ...player,
          name: player.name.trim() || `Player ${index + 1}`,
          score: 0,
          history: []
        }
      ])
    );

    const tableOrderedPlayers = sourceOrder
      .map((id) => resetById.get(id))
      .filter(Boolean);

    setTableOrder(tableOrderedPlayers.map((player) => player.id));
    setPlayers(tableOrderedPlayers);
    setTurnOrder(tableOrderedPlayers.map((player) => player.id));
    setActivePlayerIndex(0);
    setTurnActions({});
    setGameOver(false);
    resetFinalRound();
    randomizeFirstPlayerWithDelay(tableOrderedPlayers);
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
    setSelectedNames((current) => {
      if (updated.length === PLAYERS_MIN) {
        return updated;
      }

      return updated.filter(
        (playerName) => current.includes(playerName) || playerName === name
      );
    });
    setNewPlayerName("");
  }

  function removeSavedPlayer(name) {
    const updated = writeSavedPlayers(
      savedPlayers.filter((item) => item !== name)
    );

    setSavedPlayers(updated);
    setSelectedNames((current) => {
      if (updated.length === PLAYERS_MIN) {
        return updated;
      }

      if (updated.length < PLAYERS_MIN) {
        return updated;
      }

      return current.filter((item) => item !== name && updated.includes(item));
    });
  }

  function continueToOrderSetup() {
    const names = selectedNames;

    if (names.length < PLAYERS_MIN) return;

    const gamePlayers = names
      .slice(0, PLAYERS_MAX)
      .map((name, index) => makePlayer(index, name));

    const saved = writeSavedPlayers([...savedPlayers, ...names]);
    const tableOrderedIds = gamePlayers.map((player) => player.id);

    setSavedPlayers(saved);
    setPlayers(gamePlayers);
    setTurnOrder(tableOrderedIds);
    setTableOrder(tableOrderedIds);
    setStarterMessage(
      "Arrange the players by table position. First player will be chosen after this."
    );
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

      if (index === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const updated = [...current];
      [updated[index], updated[nextIndex]] = [
        updated[nextIndex],
        updated[index]
      ];

      setTableOrder(updated);
      return updated;
    });
  }


  function reorderOrderPlayer(draggedId, targetId) {
    setTurnOrder((current) => {
      const draggedIndex = current.indexOf(draggedId);
      const targetIndex = current.indexOf(targetId);

      if (draggedIndex === -1 || targetIndex === -1 || draggedId === targetId) {
        return current;
      }

      const updated = [...current];
      const [draggedPlayerId] = updated.splice(draggedIndex, 1);
      const adjustedTargetIndex = updated.indexOf(targetId);
      updated.splice(adjustedTargetIndex, 0, draggedPlayerId);

      setTableOrder(updated);
      return updated;
    });
  }

  function beginGame() {
    const tableOrderedPlayers = getOrderedPlayers(turnOrder, players);

    setTableOrder(tableOrderedPlayers.map((player) => player.id));
    setPlayers(tableOrderedPlayers);
    setTurnOrder(tableOrderedPlayers.map((player) => player.id));
    setActivePlayerIndex(0);
    setTurnActions({});
    setGameOver(false);
    resetFinalRound();
    randomizeFirstPlayerWithDelay(tableOrderedPlayers);
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
      starterMessage,
      rollingPlayerName
    },
    actions: {
      addSavedPlayer,
      addScoringAction,
      beginGame,
      continueToOrderSetup,
      farkle,
      getPlayerName,
      goHome,
      moveOrderPlayer,
      reorderOrderPlayer,
      removeSavedPlayer,
      setNewPlayerName,
      showInstructions,
      startNewGame,
      startNewGameWithCurrentPlayers,
      toggleSavedPlayer,
      undo,
      endTurn
    }
  };
}
