export default function WinnerBanner({ leader, onNewGame }) {
  return (
    <section className="winner">
      🏆 {leader.name} wins with {leader.score.toLocaleString()} points!
      <div className="winner-actions">
        <button type="button" onClick={onNewGame}>
          New Game
        </button>
      </div>
    </section>
  );
}
