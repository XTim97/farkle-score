const FIREWORK_PARTICLES = Array.from({ length: 48 }, (_, index) => ({
  id: index,
  burst: index % 6,
  angle: (index % 8) * 45,
  distance: 70 + (index % 4) * 16,
  delay: (index % 6) * 0.7,
  duration: 1.6 + (index % 3) * 0.25
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
      <div className="fireworks" aria-hidden="true">
        {FIREWORK_PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className={`firework-particle burst-${particle.burst}`}
            style={{
              "--angle": `${particle.angle}deg`,
              "--distance": `${particle.distance}px`,
              "--delay": `${particle.delay}s`,
              "--duration": `${particle.duration}s`
            }}
          />
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

          <button type="button" className="secondary" onClick={onNewPlayers}>
            👥 New Players
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
