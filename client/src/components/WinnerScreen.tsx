import type { GameState } from "@farkle/engine";
import ConfettiField from "./ConfettiField.js";

interface Props {
  game: GameState;
  saveState: "idle" | "saved" | "failed";
  onRematch: () => void;
  onNewPlayers: () => void;
  onHome: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function WinnerScreen({ game, saveState, onRematch, onNewPlayers, onHome }: Props) {
  const winner = game.players.find((p) => p.id === game.winnerId);
  const standings = [...game.players].sort((a, b) => b.score - a.score);
  const rounds = Math.ceil(game.history.length / game.players.length);
  const biggest = game.history.reduce((best, t) => Math.max(best, t.banked), 0);
  const hotRuns = game.history.reduce(
    (n, t) => n + t.rolls.slice(1).filter((r) => r === 6).length,
    0
  );

  return (
    <main className="celebration winner">
      <ConfettiField />
      <div className="trophy">🏆</div>
      <h1>{winner?.name} wins!</h1>
      <p className="winning-score">{winner?.score.toLocaleString()} points</p>
      <p className="game-summary">
        {rounds} {rounds === 1 ? "round" : "rounds"} · biggest turn {biggest.toLocaleString()}
        {hotRuns > 0 && ` · 🔥 ${hotRuns} hot-dice ${hotRuns === 1 ? "run" : "runs"}`}
      </p>
      <ol className="standings">
        {standings.map((p, i) => (
          <li key={p.id} className={p.id === game.winnerId ? "winner-row" : ""}>
            <span>
              {MEDALS[i] ?? `${i + 1} ·`} {p.name}
            </span>
            <span className="sb-score">{p.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>
      {saveState === "failed" && (
        <p className="error">Game could not be saved to the server.</p>
      )}
      <div className="celebration-actions">
        <button type="button" className="primary big" onClick={onRematch}>
          🎲 Rematch
        </button>
        <button type="button" className="big" onClick={onNewPlayers}>
          👥 New Players
        </button>
        <button type="button" className="big" onClick={onHome}>
          🏠 Home
        </button>
      </div>
    </main>
  );
}
