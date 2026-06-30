import { APP_VERSION, PLAYERS_MIN } from "./constants";
import useFarkleGame from "./hooks/useFarkleGame";
import HomeScreen from "./components/HomeScreen";
import PlayerSelectScreen from "./components/PlayerSelectScreen";
import ArrangeOrderScreen from "./components/ArrangeOrderScreen";
import MiniScoreboard from "./components/MiniScoreboard";
import GameScreen from "./components/GameScreen";

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
    starterMessage
  } = state;

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

      {screen === "home" && (
        <HomeScreen appVersion={APP_VERSION} onNewGame={actions.startNewGame} />
      )}

      {screen === "selectPlayers" && (
        <PlayerSelectScreen
          savedPlayers={savedPlayers}
          selectedNames={selectedNames}
          newPlayerName={newPlayerName}
          playersMin={PLAYERS_MIN}
          onToggleSavedPlayer={actions.toggleSavedPlayer}
          onRemoveSavedPlayer={actions.removeSavedPlayer}
          onGeneratePlayers={actions.generatePlayers}
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
          onMoveOrderPlayer={actions.moveOrderPlayer}
          onBeginGame={actions.beginGame}
        />
      )}

      {screen === "game" && activePlayer && (
        <>
          <MiniScoreboard
            players={players}
            activePlayerIndex={activePlayerIndex}
            getPlayerName={actions.getPlayerName}
          />

          <GameScreen
            activePlayer={activePlayer}
            activePlayerIndex={activePlayerIndex}
            currentTurnScore={currentTurnScore}
            currentTurnActions={currentTurnActions}
            finalRound={finalRound}
            finalRoundStarter={finalRoundStarter}
            gameOver={gameOver}
            leader={leader}
            getPlayerName={actions.getPlayerName}
            onAddScoringAction={actions.addScoringAction}
            onEndTurn={actions.endTurn}
            onFarkle={actions.farkle}
            onUndo={actions.undo}
            onNewGame={actions.startNewGame}
          />
        </>
      )}
    </main>
  );
}
