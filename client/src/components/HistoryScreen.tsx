import { useEffect, useState } from "react";
import { fetchGames, type GameSummary } from "../api.js";

interface Props {
  onBack: () => void;
  onOpen: (gameId: number) => void;
}

export default function HistoryScreen({ onBack, onOpen }: Props) {
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch(() => setError("Could not load game history"));
  }, []);

  return (
    <main className="screen">
      <h1>🕘 Game History</h1>
      {error && <p className="error">{error}</p>}
      {games && games.length === 0 && (
        <p className="hint">No finished games yet. Play one and come back!</p>
      )}

      <ul className="game-list">
        {games?.map((g) => (
          <li key={g.id}>
            <button type="button" className="game-row" onClick={() => onOpen(g.id)}>
              <span className="game-date">
                {new Date(g.endedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
              <span className="game-players">
                {g.players
                  .map(
                    (p) =>
                      `${p.playerId === g.winnerId ? "🏆 " : ""}${p.name} ${p.finalScore.toLocaleString()}`
                  )
                  .join(" · ")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="stack">
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
