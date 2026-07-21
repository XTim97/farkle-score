import FinalRoundNotice from "./FinalRoundNotice";
import MiniScoreboard from "./MiniScoreboard";
import ScoreButtons from "./ScoreButtons";
import WinnerBanner from "./WinnerBanner";

export default function GameScreen({
  activePlayer,
  activePlayerIndex,
  players,
  currentTurnScore,
  currentTurnActions,
  finalRound,
  finalRoundStarter,
  gameOver,
  leader,
  getPlayerName,
  onAddScoringAction,
  onEndTurn,
  onFarkle,
  onUndo,
  onNewGame,
  onSamePlayers,
  onHome
}) {
  if (gameOver && leader) {
    return (
      <section className="game-over-screen">
        <WinnerBanner
          leader={leader}
          onSamePlayers={onSamePlayers}
          onNewPlayers={onNewGame}
          onHome={onHome}
        />
      </section>
    );
  }

  return (
    <>
      {finalRound.active && (
        <FinalRoundNotice
          finalRoundStarter={finalRoundStarter}
          getPlayerName={getPlayerName}
        />
      )}

      <section className="turn-screen">
        <article className="player-card active-player">
          <MiniScoreboard
            players={players}
            activePlayerIndex={activePlayerIndex}
            getPlayerName={getPlayerName}
          />

          <div className="active-turn-header">
            <h2>{getPlayerName(activePlayer, activePlayerIndex)}</h2>
            <span className="active-turn-score">
              <span className="turn-label">Turn:</span>
              <strong>{currentTurnScore.toLocaleString()}</strong>
            </span>
          </div>

          <ScoreButtons
            disabled={gameOver}
            onAddScoringAction={onAddScoringAction}
          />

          <div className="card-actions">
            <button type="button" onClick={onEndTurn} disabled={gameOver}>
              End Turn
            </button>

            <button
              type="button"
              className="danger"
              onClick={onFarkle}
              disabled={gameOver}
            >
              Farkle
            </button>

            <button
              type="button"
              className="secondary"
              onClick={onUndo}
              disabled={gameOver || currentTurnActions.length === 0}
            >
              Undo
            </button>
          </div>

        </article>
      </section>
    </>
  );
}
