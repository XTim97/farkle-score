import {
  canBank,
  canFarkle,
  canRollAgain,
  canScoreCombo,
  canUndo,
  COMBOS,
  currentPlayer,
  turnDerived,
  turnLikelihood,
  type ComboKey,
  type GameState
} from "@farkle/engine";
import { useEffect, useRef, useState } from "react";
import { fmtLikelihood } from "../format.js";
import OddsPanel from "./OddsPanel.js";
import RollChips from "./RollChips.js";
import ShareBadge from "./ShareBadge.js";

interface Props {
  game: GameState;
  liveCode: string | null;
  onHelp: () => void;
  onScore: (key: ComboKey) => void;
  onRoll: () => void;
  onUndo: () => void;
  onFarkle: () => void;
  onBank: () => void;
}

const CONFETTI_COLORS = [1, 2, 3, 4, 5, 7, 8]; // series slots; 6 is too dark against the night bg

function ConfettiBurst({ burst }: { burst: number }) {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 37 + burst * 13) % 100}%`,
            animationDelay: `${(i % 5) * 0.12}s`,
            background: `var(--series-${CONFETTI_COLORS[i % CONFETTI_COLORS.length]})`
          }}
        />
      ))}
    </>
  );
}

export default function GameScreen({
  game,
  liveCode,
  onHelp,
  onScore,
  onRoll,
  onUndo,
  onFarkle,
  onBank
}: Props) {
  const active = currentPlayer(game);
  const { turnScore, diceRemaining, nextRollDice, hotDiceCount } = turnDerived(game);
  const combos = COMBOS.filter((c) => game.ruleset.comboPoints[c.key] != null);
  const leaderScore = Math.max(...game.players.map((p) => p.score));

  // Bust shake + bank confetti, driven by the latest history entry.
  const [shake, setShake] = useState(false);
  const [burst, setBurst] = useState(0);
  const seenTurns = useRef(game.history.length);
  useEffect(() => {
    if (game.history.length <= seenTurns.current) {
      seenTurns.current = game.history.length; // undo rewound a turn
      return;
    }
    seenTurns.current = game.history.length;
    const last = game.history.at(-1);
    if (!last) return;
    if (last.farkled) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
    if (last.banked > 0) {
      setBurst(game.history.length);
      const t = setTimeout(() => setBurst(0), 3400);
      return () => clearTimeout(t);
    }
  }, [game.history]);

  return (
    <main className="screen game">
      {burst > 0 && <ConfettiBurst burst={burst} />}
      <div className="screen-top">
        <button type="button" className="help-btn" aria-label="Help" onClick={onHelp}>
          ?
        </button>
        <button
          type="button"
          className="icon"
          aria-label="Undo"
          disabled={!canUndo(game)}
          onClick={onUndo}
        >
          ↩️ Undo
        </button>
        <ShareBadge liveCode={liveCode} />
      </div>
      {game.phase === "finalRound" && (
        <div className="final-round" role="status">
          🏁 Final round! Everyone gets one last turn.
        </div>
      )}

      <ul className="scoreboard">
        {game.players.map((p) => (
          <li key={p.id} className={p.id === active.id ? "active" : ""}>
            <span className="sb-name">
              {p.id === game.finalRoundTriggeredBy && "🏁 "}
              {p.name}
            </span>
            <span className="sb-col">
              <span className="sb-score score-pop" key={p.score}>
                {p.score.toLocaleString()}
              </span>
              {leaderScore > p.score && (
                <span className="sb-behind">-{(leaderScore - p.score).toLocaleString()}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <section className={`turn-panel${shake ? " farkle-hit" : ""}`}>
        <div className="turn-head">
          <h2>{active.name}</h2>
          <span className="dice-left" title="Dice remaining">
            {game.turnRolls.length > 1 &&
            game.turnRolls.at(-1)?.events.length === 0 &&
            game.turnRolls.at(-1)?.diceCount === 6 ? (
              "🔥 Hot dice! Roll all 6"
            ) : (
              <>
                <span className="dice-roll" key={game.turnRolls.length}>
                  🎲
                </span>{" "}
                × {diceRemaining}
              </>
            )}
            {hotDiceCount > 0 && <em className="hot"> 🔥{hotDiceCount}</em>}
          </span>
        </div>
        <div className="turn-score">
          Turn:{" "}
          <strong className="score-pop" key={turnScore}>
            {turnScore.toLocaleString()}
          </strong>
          {!active.onBoard && game.ruleset.entryThreshold > 0 && (
            <span className="hint"> (need {game.ruleset.entryThreshold} to get on the board)</span>
          )}
        </div>

        <RollChips rolls={game.turnRolls} />

        <div className="combo-grid">
          {combos.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`combo dice-${c.diceUsed}`}
              disabled={!canScoreCombo(game, c.key)}
              onClick={() => onScore(c.key)}
            >
              <span className="combo-label">{c.label}</span>
              <span className="combo-points">
                {game.ruleset.comboPoints[c.key]?.toLocaleString()}
              </span>
            </button>
          ))}
        </div>

        <OddsPanel game={game} variant="scorer" />

        <div className="turn-actions">
          <button type="button" disabled={!canRollAgain(game)} onClick={onRoll}>
            ↻ Roll {canRollAgain(game) ? nextRollDice : ""}
          </button>
          <button type="button" className="primary" disabled={!canBank(game)} onClick={onBank}>
            🏦 Bank {turnScore > 0 ? turnScore.toLocaleString() : ""}
          </button>
        </div>
      </section>

      <button
        type="button"
        className="danger"
        disabled={!canFarkle(game)}
        onClick={onFarkle}
      >
        💥 Farkle
      </button>

      {game.history.length > 0 && (
        <section className="history">
          <h3>This game</h3>
          <ul>
            {game.history
              .slice(-6)
              .reverse()
              .map((t) => {
                const player = game.players.find((p) => p.id === t.playerId);
                const playerTurn = game.history.filter(
                  (h) => h.playerId === t.playerId && h.turnNumber <= t.turnNumber
                ).length;
                return (
                  <li key={t.turnNumber} className={t.farkled ? "farkled" : ""}>
                    <span className="turn-label">
                      {player?.name} · turn {playerTurn}
                    </span>
                    <span className="turn-detail">
                      {t.farkled
                        ? t.penalty > 0
                          ? `💥 farkled (-${t.penalty})`
                          : "💥 farkled"
                        : `banked ${t.banked.toLocaleString()}`}
                      <span className="turn-odds">
                        {" "}
                        🎲 {fmtLikelihood(turnLikelihood(t.rolls, t.events, t.farkled, game.ruleset))}
                      </span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </main>
  );
}
