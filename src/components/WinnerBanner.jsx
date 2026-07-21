export default function WinnerBanner({ leader, onSamePlayers, onNewPlayers, onHome }) {
  return (
    <section className="winner">
      <div className="winner-title">🏆 {leader.name} Wins!</div>

      <div className="winning-score-label">Winning Score</div>
      <div className="winning-score">
        {leader.score.toLocaleString()} Points
      </div>

      <div className="winner-actions">
        <button type="button" onClick={onSamePlayers}>
          🎲 Same Players
        </button>

        <button type="button" className="secondary" onClick={onNewPlayers}>
          👥 New Players
        </button>

        <button type="button" className="secondary" onClick={onHome}>
          🏠 Home
        </button>
      </div>
    </section>
  );
}
