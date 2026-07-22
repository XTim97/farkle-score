import { useEffect, useState } from "react";
import { fetchStats, type PlayerStats } from "../api.js";

interface Props {
  onBack: () => void;
}

const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(0)}%` : "–");

export default function StatsScreen({ onBack }: Props) {
  const [stats, setStats] = useState<PlayerStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError("Could not load stats"));
  }, []);

  const played = stats?.filter((s) => s.gamesPlayed > 0) ?? [];

  return (
    <main className="screen">
      <h1>📊 Player Stats</h1>
      {error && <p className="error">{error}</p>}
      {stats && played.length === 0 && (
        <p className="hint">No finished games yet. Play one and come back!</p>
      )}

      {played.map((s) => (
        <section key={s.playerId} className="stat-card">
          <div className="stat-card-head">
            <strong>{s.name}</strong>
            <span className="rs-summary">
              {s.wins} {s.wins === 1 ? "win" : "wins"} in {s.gamesPlayed}{" "}
              {s.gamesPlayed === 1 ? "game" : "games"}
            </span>
          </div>
          <div className="stat-grid">
            <div className="stat-tile">
              <span className="stat-value">{pct(s.wins, s.gamesPlayed)}</span>
              <span className="stat-label">win rate</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">
                {s.turns > 0 ? Math.round(s.totalBanked / s.turns).toLocaleString() : "–"}
              </span>
              <span className="stat-label">avg turn</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">{pct(s.farkles, s.turns)}</span>
              <span className="stat-label">farkle rate</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">{s.bestTurn.toLocaleString()}</span>
              <span className="stat-label">best turn</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">{s.bestGame.toLocaleString()}</span>
              <span className="stat-label">best game</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">{s.hotDiceTurns}</span>
              <span className="stat-label">hot-dice turns</span>
            </div>
          </div>
          {s.threeFarklePenalties > 0 && (
            <p className="stat-footnote">
              💥 Hit the three-farkle penalty {s.threeFarklePenalties}{" "}
              {s.threeFarklePenalties === 1 ? "time" : "times"}.
            </p>
          )}
        </section>
      ))}

      <div className="stack">
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
