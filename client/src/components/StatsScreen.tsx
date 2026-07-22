import { useEffect, useState } from "react";
import { fetchStats, type PlayerStats } from "../api.js";

interface Props {
  onBack: () => void;
}

const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(0)}%` : "–");

export default function StatsScreen({ onBack }: Props) {
  const [stats, setStats] = useState<PlayerStats[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(playerId: number) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

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
          <button
            type="button"
            className="stat-card-head"
            onClick={() => toggle(s.playerId)}
            aria-expanded={expanded.has(s.playerId)}
          >
            <strong>{s.name}</strong>
            <span className="rs-summary">
              {s.wins} {s.wins === 1 ? "win" : "wins"} in {s.gamesPlayed}{" "}
              {s.gamesPlayed === 1 ? "game" : "games"}
              {s.turns > 0 && ` · ${pct(s.farkles, s.turns)} farkle`}{" "}
              <span aria-hidden="true">{expanded.has(s.playerId) ? "▾" : "▸"}</span>
            </span>
          </button>
          {expanded.has(s.playerId) && (
            <>
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
          {(s.knownRolls > 0 || s.avgFatalRollProb != null || s.avgDiceLeftAtBank != null) && (
            <>
              <div className="stat-section-label">🍀 Luck &amp; 🛡️ Caution</div>
              <div className="stat-grid">
                {s.knownRolls > 0 && (
                  <div className="stat-tile">
                    <span className="stat-value">
                      {(() => {
                        const luck = s.expectedFarkles - s.knownFarkles;
                        return `${luck >= 0 ? "+" : ""}${luck.toFixed(1)}`;
                      })()}
                    </span>
                    <span className="stat-label">farkles dodged vs expected</span>
                  </div>
                )}
                {s.knownRolls > 0 && s.expectedPoints > 0 && (
                  <div className="stat-tile">
                    <span className="stat-value">
                      {Math.round((s.actualPoints / s.expectedPoints) * 100)}%
                    </span>
                    <span className="stat-label">roll yield vs expected</span>
                  </div>
                )}
                {s.avgFatalRollProb != null && (
                  <div className="stat-tile">
                    <span className="stat-value">{(s.avgFatalRollProb * 100).toFixed(0)}%</span>
                    <span className="stat-label">avg odds when farkled</span>
                  </div>
                )}
                {s.avgDiceLeftAtBank != null && (
                  <div className="stat-tile">
                    <span className="stat-value">{s.avgDiceLeftAtBank.toFixed(1)}</span>
                    <span className="stat-label">dice left at bank</span>
                  </div>
                )}
                {s.knownRolls > 0 && (
                  <div className="stat-tile">
                    <span className="stat-value">
                      {Math.round((s.riskyRolls / s.knownRolls) * 100)}%
                    </span>
                    <span className="stat-label">risky rolls (≤2 dice)</span>
                  </div>
                )}
                {s.knownTurns > 0 && (
                  <div className="stat-tile">
                    <span className="stat-value">{(s.knownRolls / s.knownTurns).toFixed(1)}</span>
                    <span className="stat-label">rolls per turn</span>
                  </div>
                )}
                {s.knownRolls > 0 && (
                  <div className="stat-tile">
                    <span className="stat-value">
                      {Math.round(s.actualPoints / s.knownRolls).toLocaleString()}
                    </span>
                    <span className="stat-label">points per roll</span>
                  </div>
                )}
              </div>
              {s.knownRolls > 0 && (
                <p className="stat-footnote">
                  Luck is measured over {s.knownRolls} tracked rolls. Above 100% yield or
                  positive farkle-dodging = lucky; low dice-left and high risky-roll numbers =
                  bold play.
                </p>
              )}
            </>
          )}
          {s.threeFarklePenalties > 0 && (
            <p className="stat-footnote">
              💥 Hit the three-farkle penalty {s.threeFarklePenalties}{" "}
              {s.threeFarklePenalties === 1 ? "time" : "times"}.
            </p>
          )}
            </>
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
