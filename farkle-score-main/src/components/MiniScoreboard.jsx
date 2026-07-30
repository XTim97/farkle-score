export default function MiniScoreboard({
  players,
  activePlayerIndex,
  getPlayerName
}) {
  return (
    <section className="mini-scoreboard">
      {players.map((player, index) => (
        <div
          key={player.id}
          className={`mini-score ${
            index === activePlayerIndex ? "active-player" : ""
          }`}
        >
          <strong>{getPlayerName(player, index)}</strong>
          <span>{player.score.toLocaleString()}</span>
        </div>
      ))}
    </section>
  );
}
