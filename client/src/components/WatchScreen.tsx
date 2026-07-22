import { currentPlayer, turnDerived, type GameState } from "@farkle/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import { commentary } from "../commentary.js";
import OddsPanel from "./OddsPanel.js";
import RaceChart, { type RaceData } from "./RaceChart.js";
import RollChips from "./RollChips.js";

interface Props {
  code: string;
  onExit: () => void;
}

type Status = "connecting" | "live" | "waiting" | "lost";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function WatchScreen({ code, onExit }: Props) {
  const [game, setGame] = useState<GameState | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const retryRef = useRef(0);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    // WS delivers pushes; the GET covers state published before we joined.
    fetch(`/api/live/${code}`)
      .then((r) => (r.ok ? (r.json() as Promise<GameState>) : null))
      .then((s) => {
        if (s) setGame(s);
      })
      .catch(() => undefined);

    function connect() {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${proto}://${location.host}/api/live/${code}/ws`);
      socket.onopen = () => {
        retryRef.current = 0;
        setStatus((s) => (s === "live" ? s : "waiting"));
      };
      socket.onmessage = (event) => {
        setGame(JSON.parse(event.data as string) as GameState);
        setStatus("live");
      };
      socket.onclose = () => {
        if (closed) return;
        setStatus("lost");
        retryRef.current += 1;
        retryTimer = setTimeout(connect, Math.min(1000 * 2 ** retryRef.current, 15000));
      };
    }
    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [code]);

  // Bust shake on the spotlight, driven by the latest history entry.
  const [shake, setShake] = useState(false);
  const seenTurns = useRef(0);
  useEffect(() => {
    const len = game?.history.length ?? 0;
    if (len <= seenTurns.current) {
      seenTurns.current = len;
      return;
    }
    seenTurns.current = len;
    if (game?.history.at(-1)?.farkled) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [game]);

  const call = useMemo(() => (game ? commentary(game) : null), [game]);

  if (!game) {
    return (
      <main className="screen">
        <h1>📺 Watching {code}</h1>
        <p className="hint">
          {status === "lost"
            ? "Connection lost. Retrying…"
            : "Waiting for the scorer to start playing…"}
        </p>
        <div className="stack">
          <button type="button" className="secondary" onClick={onExit}>
            ← Leave
          </button>
        </div>
      </main>
    );
  }

  const active = game.phase !== "finished" ? currentPlayer(game) : null;
  const { turnScore, diceRemaining, hotDiceCount } = turnDerived(game);
  const winner = game.players.find((p) => p.id === game.winnerId);
  const leaderScore = Math.max(...game.players.map((p) => p.score));
  const round = Math.floor(game.history.length / game.players.length) + 1;
  const seatOf = new Map(game.players.map((p, i) => [p.id, i]));
  const ranked = [...game.players].sort((a, b) => b.score - a.score);
  const hotDiceNow =
    game.turnRolls.length > 1 &&
    game.turnRolls.at(-1)?.events.length === 0 &&
    game.turnRolls.at(-1)?.diceCount === 6;

  const raceData: RaceData = {
    players: game.players.map((p, i) => ({ playerId: i, name: p.name, seatOrder: i })),
    turns: game.history.map((t) => ({
      playerId: seatOf.get(t.playerId) ?? 0,
      banked: t.banked,
      penalty: t.penalty
    }))
  };

  const biggest = game.history.reduce(
    (best, t) => (t.banked > best.banked ? t : best),
    { banked: 0, playerId: "" }
  );
  const farkles = game.history.filter((t) => t.farkled).length;
  const hotRuns =
    game.history.reduce(
      (n, t) => n + t.rolls.slice(1).filter((r) => r === 6).length,
      0
    ) + hotDiceCount;
  const trigger = game.players.find((p) => p.id === game.finalRoundTriggeredBy);

  const ticker = game.history
    .slice(-3)
    .reverse()
    .map((t) => {
      const name = game.players.find((p) => p.id === t.playerId)?.name;
      return t.farkled
        ? `${name} farkled with ${t.rolls.at(-1) ?? "?"} dice`
        : `${name} banked ${t.banked.toLocaleString()}`;
    });

  return (
    <main className="watch-board">
      {game.phase === "finalRound" && <div className="sudden-death-frame" />}
      <header className="wb-header">
        <h1 className="wb-title">
          🎲 FARKLE <span className="accent">NIGHT</span>
        </h1>
        <div className="wb-meta">
          <span className="wb-round">
            Round {round} · to {game.ruleset.winningScore.toLocaleString()}
          </span>
          <span className="share-badge wb-live">
            {status === "live" && <i className="live-dot" />}
            {status === "live"
              ? `LIVE · ${code}`
              : status === "lost"
                ? "○ reconnecting…"
                : `● ${code}`}
          </span>
          <button type="button" className="icon" aria-label="Leave" onClick={onExit}>
            ✕
          </button>
        </div>
      </header>

      {game.phase === "finalRound" && trigger && (
        <div className="final-round sudden-banner" role="status">
          <span className="hot">⚡</span>
          SUDDEN DEATH: {trigger.name} hit {trigger.score.toLocaleString()}! One last turn
          each to beat it
          <span className="hot">⚡</span>
        </div>
      )}
      {game.phase === "finished" && winner && (
        <div className="final-round" role="status">
          🏆 {winner.name} wins with {winner.score.toLocaleString()}!
        </div>
      )}

      <div className="wb-grid">
        <section className="wb-col">
          <h2 className="wb-label">Leaderboard</h2>
          <ol className="wb-board">
            {ranked.map((p, i) => {
              const rolling = active != null && p.id === active.id;
              return (
                <li
                  key={p.id}
                  className={`wb-row${rolling ? " rolling" : ""}${i >= 3 ? " trailing" : ""}`}
                >
                  <span className={`wb-medal${i >= 3 ? " plain" : ""}`}>
                    {MEDALS[i] ?? i + 1}
                  </span>
                  <i className={`series-dot s${(seatOf.get(p.id) ?? 0) + 1}`} />
                  <span className="wb-name">
                    {p.id === game.finalRoundTriggeredBy && "🏁 "}
                    {p.name}
                    {rolling && <span className="rolling-tag"> ● ROLLING</span>}
                  </span>
                  <span className="sb-col">
                    <span className="sb-score score-pop" key={p.score}>
                      {p.score.toLocaleString()}
                    </span>
                    {leaderScore > p.score && (
                      <span className="sb-behind">
                        -{(leaderScore - p.score).toLocaleString()} behind
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          {game.history.length > 0 && (
            <div className="wb-chart">
              <RaceChart detail={raceData} />
            </div>
          )}
        </section>

        <section className="wb-col">
          <h2 className="wb-label">Now rolling</h2>
          {active && (
            <div className={`turn-panel wb-spotlight${shake ? " farkle-hit" : ""}`}>
              <i className={`series-dot s${(seatOf.get(active.id) ?? 0) + 1}`} />
              <div className="spotlight-name">{active.name}</div>
              {hotDiceNow ? (
                <div className="hot spotlight-hot">🔥 HOT DICE! All 6 back!</div>
              ) : (
                hotDiceCount > 0 && (
                  <div className="hot spotlight-hot">🔥 {hotDiceCount} hot dice this turn</div>
                )
              )}
              <div className="spotlight-score score-pop" key={turnScore}>
                +{turnScore.toLocaleString()}
              </div>
              <div className="spotlight-sub">
                this turn · 🎲 × {diceRemaining} to roll
              </div>
              <RollChips rolls={game.turnRolls} />
              <OddsPanel game={game} />
            </div>
          )}

          {call && (
            <div className="commentary" role="status">
              <p className="commentary-line">{call.line}</p>
              {call.color && <p className="commentary-color">{call.color}</p>}
            </div>
          )}

          {game.history.length > 0 && (
            <div className="wb-stats">
              <div className="stat-tile">
                <span className="stat-value">{biggest.banked.toLocaleString()}</span>
                <span className="stat-label">
                  biggest turn
                  {biggest.playerId &&
                    ` · ${game.players.find((p) => p.id === biggest.playerId)?.name}`}
                </span>
              </div>
              <div className="stat-tile">
                <span className="stat-value">💥 {farkles}</span>
                <span className="stat-label">farkles tonight</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value">🔥 {hotRuns}</span>
                <span className="stat-label">hot dice runs</span>
              </div>
            </div>
          )}

          {ticker.length > 0 && (
            <div className="wb-ticker">📣 Last: {ticker.join(" · ")}</div>
          )}
        </section>
      </div>
    </main>
  );
}
