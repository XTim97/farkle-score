export default function HomeScreen({ appVersion, onNewGame }) {
  return (
    <section className="home-screen">
      <h1>Farkle Score</h1>
      <p className="version">{appVersion}</p>

      <button type="button" className="new-game-button" onClick={onNewGame}>
        New Game
      </button>
    </section>
  );
}
