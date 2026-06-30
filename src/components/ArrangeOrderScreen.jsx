export default function ArrangeOrderScreen({
  starterMessage,
  orderedSetupPlayers,
  getPlayerName,
  onMoveOrderPlayer,
  onBeginGame
}) {
  return (
    <section className="order-setup">
      <h1>Arrange Playing Order</h1>

      <section className="starter-message">{starterMessage}</section>

      <div className="order-list">
        {orderedSetupPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`order-item ${index === 0 ? "locked-starter" : ""}`}
          >
            <span>
              {index + 1}. {getPlayerName(player, index)}
            </span>

            {index === 0 ? (
              <strong>First Player</strong>
            ) : (
              <div className="order-buttons">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onMoveOrderPlayer(player.id, -1)}
                  disabled={index === 1}
                >
                  ↑
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => onMoveOrderPlayer(player.id, 1)}
                  disabled={index === orderedSetupPlayers.length - 1}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={onBeginGame}>
        Begin Game
      </button>
    </section>
  );
}
