import FinalRoundNotice from "./FinalRoundNotice";
import ScoreButtons from "./ScoreButtons";
import TurnHistory from "./TurnHistory";
import WinnerBanner from "./WinnerBanner";

export default function GameScreen({
  activePlayer,
  activePlayerIndex,
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
  onNewGame
}) {
  return (
    <>
      {finalRound.active && !gameOver && (
        <FinalRoundNotice
          finalRoundStarter={finalRoundStarter}
          getPlayerName={getPlayerName}
        />
      )}

      {gameOver && leader && (
        <WinnerBanner leader={leader} onNewGame={onNewGame} />
      )}

      <section className="turn-screen">
        <article className="player-card active-player">
          <h2>{getPlayerName(activePlayer, activePlayerIndex)}</h2>

          <div className="history">
            <strong>Total Score:</strong> {activePlayer.score.toLocaleString()}
          </div>

          <p className="score-label">Current Turn Score</p>

          <div className="score">{currentTurnScore.toLocaleString()}</div>

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

          <TurnHistory
            currentTurnActions={currentTurnActions}
            playerHistory={activePlayer.history}
          />
        </article>
      </section>
    </>
  );
}
