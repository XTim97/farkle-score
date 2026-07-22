import type { GameState } from "@farkle/engine";

interface Props {
  game: GameState;
  saveState: "idle" | "saved" | "failed";
  onRematch: () => void;
  onNewPlayers: () => void;
  onHome: () => void;
}

export default function WinnerScreen({ game, saveState, onRematch, onNewPlayers, onHome }: Props) {
  const winner = game.players.find((p) => p.id === game.winnerId);
  const standings = [...game.players].sort((a, b) => b.score - a.score);

  return (
    <main className="screen winner">
      <h1>🏆 {winner?.name} wins!</h1>
      <p className="winning-score">{winner?.score.toLocaleString()} points</p>
      <ol className="standings">
        {standings.map((p) => (
          <li key={p.id} className={p.id === game.winnerId ? "winner-row" : ""}>
            <span>{p.name}</span>
            <span>{p.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
      {saveState === "failed" && (
        <p className="error">Game could not be saved to the server.</p>
      )}
      <div className="stack">
        <button type="button" className="primary big" onClick={onRematch}>
          🔁 Same Players
        </button>
        <button type="button" className="secondary" onClick={onNewPlayers}>
          👥 New Players
        </button>
        <button type="button" className="secondary" onClick={onHome}>
          🏠 Home
        </button>
      </div>
    </main>
  );
}
