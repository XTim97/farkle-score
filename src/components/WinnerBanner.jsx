const BALLOONS = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: 3 + ((index * 17) % 94),
  delay: (index % 9) * 0.55,
  duration: 5.8 + (index % 5) * 0.55,
  size: 28 + (index % 4) * 8,
  drift: -36 + (index % 7) * 12,
  colorClass: `balloon-color-${(index % 6) + 1}`
}));

export default function WinnerBanner({
  leader,
  players,
  getPlayerName,
  onSamePlayers,
  onNewPlayers,
  onHome
}) {
  const otherPlayers = [...players]
    .filter((player) => player.id !== leader.id)
    .sort((a, b) => b.score - a.score);

  return (
    <section className="winner">
      <div className="balloons" aria-hidden="true">
        {BALLOONS.map((balloon) => (
          <span
            key={balloon.id}
            className={`balloon ${balloon.colorClass}`}
            style={{
              "--balloon-left": `${balloon.left}%`,
              "--balloon-delay": `${balloon.delay}s`,
              "--balloon-duration": `${balloon.duration}s`,
              "--balloon-size": `${balloon.size}px`,
              "--balloon-drift": `${balloon.drift}px`
            }}
          >
            <span className="balloon-string" />
          </span>
        ))}
      </div>

      <div className="winner-content">
        <div className="winner-title">🏆 {leader.name} Wins!</div>

        <div className="winning-score-label">Winning Score</div>
        <div className="winning-score">
          {leader.score.toLocaleString()} Points
        </div>

        <div className="congratulations">🎉 Congratulations! 🎉</div>

        <div className="winner-actions">
          <button type="button" onClick={onSamePlayers}>
            🎲 Same Players
          </button>

          <button type="button" className="winner-new-players" onClick={onNewPlayers}>
            👥 Select New Players
          </button>

          <button type="button" className="secondary" onClick={onHome}>
            🏠 Home
          </button>
        </div>

        {otherPlayers.length > 0 && (
          <div className="final-scores-row" aria-label="Other players final scores">
            {otherPlayers.map((player, index) => (
              <span className="final-score-item" key={player.id}>
                <strong>{getPlayerName(player, index)}</strong>{" "}
                {player.score.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
