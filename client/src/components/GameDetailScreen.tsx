import { comboByKey, type ComboKey } from "@farkle/engine";
import { useEffect, useState } from "react";
import { fetchGameDetail, type GameDetail } from "../api.js";
import RaceChart from "./RaceChart.js";

interface Props {
  gameId: number;
  onBack: () => void;
}

export default function GameDetailScreen({ gameId, onBack }: Props) {
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGameDetail(gameId)
      .then(setDetail)
      .catch(() => setError("Could not load this game"));
  }, [gameId]);

  const nameOf = (playerId: number) =>
    detail?.players.find((p) => p.playerId === playerId)?.name ?? "?";

  return (
    <main className="screen">
      <h1>Game Replay</h1>
      {error && <p className="error">{error}</p>}

      {detail && (
        <>
          <p className="hint">
            {new Date(detail.endedAt).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric"
            })}{" "}
            · {detail.ruleset.name} · to {detail.ruleset.winningScore.toLocaleString()}
          </p>

          <ol className="standings">
            {[...detail.players]
              .sort((a, b) => b.finalScore - a.finalScore)
              .map((p) => (
                <li
                  key={p.playerId}
                  className={p.playerId === detail.winnerId ? "winner-row" : ""}
                >
                  <span>
                    {p.playerId === detail.winnerId && "🏆 "}
                    {p.name}
                  </span>
                  <span>{p.finalScore.toLocaleString()}</span>
                </li>
              ))}
          </ol>

          <RaceChart detail={detail} />

          <section className="history">
            <h3>Turn by turn</h3>
            <ul>
              {detail.turns.map((t) => (
                <li key={t.turnNumber} className={t.farkled ? "farkled" : ""}>
                  <span className="turn-label">
                    #{t.turnNumber} {nameOf(t.playerId)}
                  </span>
                  <span className="turn-detail">
                    {t.events
                      .map((e) => comboByKey.get(e.comboKey as ComboKey)?.label ?? e.comboKey)
                      .join(", ") || "–"}
                    {"  "}
                    {t.farkled
                      ? t.penalty > 0
                        ? `💥 -${t.penalty.toLocaleString()}`
                        : "💥"
                      : `+${t.banked.toLocaleString()}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="stack">
        <button type="button" className="secondary" onClick={onBack}>
          ← Back to History
        </button>
      </div>
    </main>
  );
}
