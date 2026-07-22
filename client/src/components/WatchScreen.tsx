import { comboByKey, currentPlayer, turnDerived, type GameState } from "@farkle/engine";
import { useEffect, useRef, useState } from "react";
import OddsPanel from "./OddsPanel.js";

interface Props {
  code: string;
  onExit: () => void;
}

type Status = "connecting" | "live" | "waiting" | "lost";

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

  return (
    <main className="screen game">
      <div className="watch-bar">
        <span>📺 {code}</span>
        <span className={`watch-status ${status}`}>
          {status === "live" ? "● live" : status === "lost" ? "○ reconnecting…" : "● connected"}
        </span>
      </div>

      {game.phase === "finalRound" && (
        <div className="final-round" role="status">
          🏁 Final round! Everyone gets one last turn.
        </div>
      )}
      {game.phase === "finished" && winner && (
        <div className="final-round" role="status">
          🏆 {winner.name} wins with {winner.score.toLocaleString()}!
        </div>
      )}

      <ul className="scoreboard">
        {game.players.map((p) => (
          <li key={p.id} className={active && p.id === active.id ? "active" : ""}>
            <span className="sb-name">
              {p.id === game.finalRoundTriggeredBy && "🏁 "}
              {p.name}
            </span>
            <span className="sb-score">{p.score.toLocaleString()}</span>
          </li>
        ))}
      </ul>

      {active && (
        <section className="turn-panel">
          <div className="turn-head">
            <h2>{active.name}</h2>
            <span className="dice-left" title="Dice remaining">
              🎲 × {diceRemaining}
              {hotDiceCount > 0 && <em className="hot"> 🔥{hotDiceCount}</em>}
            </span>
          </div>
          <div className="turn-score">
            Turn: <strong>{turnScore.toLocaleString()}</strong>
          </div>
          <OddsPanel game={game} />
          {game.turnEvents.length > 0 && (
            <div className="event-chips">
              {game.turnEvents.map((e, i) => (
                <span key={i} className="chip">
                  {comboByKey.get(e.comboKey)?.label} +{e.points}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {game.history.length > 0 && (
        <section className="history">
          <h3>Recent turns</h3>
          <ul>
            {game.history
              .slice(-6)
              .reverse()
              .map((t) => {
                const player = game.players.find((p) => p.id === t.playerId);
                return (
                  <li key={t.turnNumber} className={t.farkled ? "farkled" : ""}>
                    <span>{player?.name}</span>
                    <span>
                      {t.farkled
                        ? t.penalty > 0
                          ? `💥 Farkle (-${t.penalty})`
                          : "💥 Farkle"
                        : `+${t.banked.toLocaleString()}`}
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <div className="stack">
        <button type="button" className="secondary" onClick={onExit}>
          ← Leave
        </button>
      </div>
    </main>
  );
}
