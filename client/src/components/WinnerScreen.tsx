import type { GameState } from "@farkle/engine";

interface Props {
  game: GameState;
  saveState: "idle" | "saved" | "failed";
  onRematch: () => void;
  onNewPlayers: () => void;
  onHome: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** Looping confetti field from the mockup: position, size, timing per piece. */
const PIECES = [
  { left: 6, w: 10, h: 14, dur: 3.1, delay: 0, color: "var(--primary)" },
  { left: 16, w: 9, h: 13, dur: 2.6, delay: 0.7, color: "var(--accent)" },
  { left: 26, w: 11, h: 15, dur: 3.4, delay: 0.3, color: "var(--info)" },
  { left: 36, w: 9, h: 12, dur: 2.8, delay: 1.2, color: "var(--danger)" },
  { left: 46, w: 10, h: 14, dur: 3.0, delay: 0.5, color: "var(--series-5)" },
  { left: 56, w: 9, h: 13, dur: 2.5, delay: 1.6, color: "var(--accent)" },
  { left: 66, w: 11, h: 15, dur: 3.3, delay: 0.9, color: "var(--primary)" },
  { left: 76, w: 10, h: 13, dur: 2.7, delay: 0.2, color: "var(--info)" },
  { left: 86, w: 9, h: 14, dur: 3.2, delay: 1.4, color: "var(--series-5)" },
  { left: 94, w: 10, h: 13, dur: 2.9, delay: 0.6, color: "var(--danger)" }
];

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
      {PIECES.map((p, i) => (
        <span
          key={i}
          className="confetti-loop"
          style={{
            left: `${p.left}vw`,
            width: p.w,
            height: p.h,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
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
