export default function RollForFirstPlayerScreen({
  players,
  getPlayerName,
  onSelectWinner
}) {
  return (
    <section className="order-setup roll-for-first-screen">
      <h1>Roll for First Player</h1>
      <p className="order-help">
        Have each player roll one real die. Then tap the player who rolled the
        highest number.
      </p>

      <div className="die-roll-list">
        {players.map((player, index) => (
          <button
            key={player.id}
            type="button"
            className="highest-roller-button"
            onClick={() => onSelectWinner(player.id)}
          >
            {getPlayerName(player, index)}
          </button>
        ))}
      </div>
    </section>
  );
}
