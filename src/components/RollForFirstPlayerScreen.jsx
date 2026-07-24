function dieFace(value) {
  return value ? String(value) : "—";
}

export default function RollForFirstPlayerScreen({
  players,
  rollResults,
  tiedPlayerIds,
  rollWinnerId,
  getPlayerName,
  onRoll,
  onContinue
}) {
  const isTieBreaker = tiedPlayerIds.length > 0;
  const eligibleIds = isTieBreaker
    ? new Set(tiedPlayerIds)
    : new Set(players.map((player) => player.id));

  return (
    <section className="order-setup roll-for-first-screen">
      <h1>Roll for First Player</h1>
      <p className="order-help">
        {isTieBreaker
          ? "The highest roll was tied. Only the tied players roll again."
          : "Each player taps Roll Die once. The highest roll starts the game."}
      </p>

      <div className="die-roll-list">
        {players.map((player, index) => {
          const result = rollResults[player.id];
          const eligible = eligibleIds.has(player.id);
          const isWinner = rollWinnerId === player.id;

          return (
            <article
              key={player.id}
              className={`die-roll-row ${isWinner ? "die-roll-winner" : ""}`}
            >
              <span className="die-roll-player">{getPlayerName(player, index)}</span>
              <strong className="die-result" aria-label={result ? `Rolled ${result}` : "Not rolled"}>
                {dieFace(result)}
              </strong>
              <button
                type="button"
                onClick={() => onRoll(player.id)}
                disabled={!eligible || Boolean(result) || Boolean(rollWinnerId)}
              >
                {result ? "Rolled" : "Roll Die"}
              </button>
            </article>
          );
        })}
      </div>

      {rollWinnerId ? (
        <button type="button" onClick={onContinue}>
          Start Game
        </button>
      ) : null}
    </section>
  );
}
