import { APP_VERSION, PLAYERS_MIN } from "./constants";
import useFarkleGame from "./hooks/useFarkleGame";
import HomeScreen from "./components/HomeScreen";
import PlayerSelectScreen from "./components/PlayerSelectScreen";
import ArrangeOrderScreen from "./components/ArrangeOrderScreen";
import RollingFirstPlayerScreen from "./components/RollingFirstPlayerScreen";
import GameScreen from "./components/GameScreen";
import InstructionsScreen from "./components/InstructionsScreen";

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
        <HomeScreen
          appVersion={APP_VERSION}
          onNewGame={actions.startNewGame}
          onInstructions={actions.showInstructions}
        />
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
            onEndTurn={actions.endTurn}
            onFarkle={actions.farkle}
            onUndo={actions.undo}
            onNewGame={actions.startNewGame}
            onSamePlayers={actions.startNewGameWithCurrentPlayers}
            onHome={actions.goHome}
          />
      )}
    </main>
  );
}
