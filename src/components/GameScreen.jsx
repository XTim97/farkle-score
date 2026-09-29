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
  sessionWins = {},
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
          players={[leader]}
          getPlayerName={getPlayerName}
          onSamePlayers={onSamePlayers}
          onNewPlayers={onNewGame}
          onHome={onHome}
        />
        <aside
          aria-label="Session wins"
          style={{
            margin: "20px auto",
            padding: "20px",
            width: "100%",
            maxWidth: "520px",
            boxSizing: "border-box",
            border: "2px solid #ffd700",
            borderRadius: "12px",
            background: "#171717",
            color: "#fff"
          }}
        >
          <h2 style={{ margin: "0 0 16px", color: "#ffd700", textAlign: "center" }}>
            Session Wins
          </h2>
          {players.map((player, index) => (
            <div
              key={player.id}
              style={{ display: "flex", justifyContent: "space-between", gap: "20px", padding: "8px 0", fontSize: "1.25rem" }}
            >
              <span>{getPlayerName(player, index)}</span>
              <strong style={{ color: "#ffd700" }}>{sessionWins[player.id] || 0}</strong>
            </div>
          ))}
        </aside>
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
              className="secondary undo-button"
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
