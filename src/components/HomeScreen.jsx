export default function HomeScreen({ appVersion, onNewGame, onInstructions }) {
  return (
    <section className="home-screen">
      <h1>Farkle Score</h1>
      <p className="version">{appVersion}</p>

      <div className="home-actions">
        <button type="button" className="new-game-button" onClick={onNewGame}>
          New Game
        </button>

        <button
          type="button"
          className="instructions-button secondary"
          onClick={onInstructions}
        >
          📖 Player Instructions
        </button>
      </div>
    </section>
  );
}
