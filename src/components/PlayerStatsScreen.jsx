import { useMemo, useState } from "react";
import { getAchievements } from "../utils/playerStats";

function Stat({ label, value }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function PlayerStatsScreen({ playerStats, onBack }) {
  const records = useMemo(
    () => Object.values(playerStats).sort((a, b) => a.name.localeCompare(b.name)),
    [playerStats]
  );
  const [selectedKey, setSelectedKey] = useState(
    records.length > 0 ? records[0].name.toLocaleLowerCase() : ""
  );

  const selected =
    playerStats[selectedKey] ||
    records.find((record) => record.name.toLocaleLowerCase() === selectedKey) ||
    records[0];

  if (!selected) {
    return (
      <section className="panel statistics-screen">
        <h1>Player Statistics</h1>
        <div className="empty-state">
          <p>No completed games have been recorded yet.</p>
          <p>Statistics will appear after the next finished game.</p>
        </div>
        <button type="button" onClick={onBack}>Back Home</button>
      </section>
    );
  }

  const winPercentage =
    selected.gamesPlayed > 0
      ? ((selected.gamesWon / selected.gamesPlayed) * 100).toFixed(1)
      : "0.0";
  const averageTurn =
    selected.totalTurns > 0
      ? Math.round(selected.totalPoints / selected.totalTurns)
      : 0;
  const achievements = getAchievements(selected);
  const headToHead = Object.values(selected.headToHead || {}).sort(
    (a, b) => b.games - a.games || a.opponentName.localeCompare(b.opponentName)
  );

  return (
    <section className="panel statistics-screen">
      <h1>Player Statistics</h1>

      <div className="stats-player-tabs" aria-label="Choose a player">
        {records.map((record) => {
          const key = record.name.toLocaleLowerCase();
          return (
            <button
              type="button"
              key={key}
              className={key === selected.name.toLocaleLowerCase() ? "selected" : "secondary"}
              onClick={() => setSelectedKey(key)}
            >
              {record.name}
            </button>
          );
        })}
      </div>

      <h2>{selected.name}</h2>

      <div className="statistics-grid">
        <Stat label="Games Played" value={selected.gamesPlayed.toLocaleString()} />
        <Stat label="Games Won" value={selected.gamesWon.toLocaleString()} />
        <Stat label="Win Percentage" value={`${winPercentage}%`} />
        <Stat label="Second Places" value={selected.secondPlaceFinishes.toLocaleString()} />
        <Stat label="Third Places" value={selected.thirdPlaceFinishes.toLocaleString()} />
        <Stat label="Total Points" value={selected.totalPoints.toLocaleString()} />
        <Stat label="Average Turn" value={averageTurn.toLocaleString()} />
        <Stat label="Highest Turn" value={selected.highestTurn.toLocaleString()} />
        <Stat label="Highest Game" value={selected.highestGameScore.toLocaleString()} />
        <Stat label="Total Farkles" value={selected.totalFarkles.toLocaleString()} />
        <Stat label="Current Win Streak" value={selected.currentWinningStreak.toLocaleString()} />
        <Stat label="Longest Win Streak" value={selected.longestWinningStreak.toLocaleString()} />
      </div>

      <section className="stats-section">
        <h2>Head-to-Head Records</h2>
        {headToHead.length === 0 ? (
          <p>No head-to-head games recorded.</p>
        ) : (
          <div className="head-to-head-list">
            {headToHead.map((record) => (
              <div className="head-to-head-row" key={record.opponentName.toLocaleLowerCase()}>
                <strong>vs. {record.opponentName}</strong>
                <span>{record.wins} W — {record.losses} L — {record.ties} T</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stats-section">
        <h2>Achievements</h2>
        <div className="achievement-grid">
          {achievements.map((achievement) => (
            <article
              key={achievement.name}
              className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`}
            >
              <span className="achievement-icon">{achievement.unlocked ? achievement.icon : "🔒"}</span>
              <strong>{achievement.name}</strong>
              <small>{achievement.description}</small>
            </article>
          ))}
        </div>
      </section>

      <button type="button" onClick={onBack}>Back Home</button>
    </section>
  );
}
