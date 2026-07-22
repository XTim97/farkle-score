import {
  canBank,
  canScoreCombo,
  canUndo,
  COMBOS,
  comboByKey,
  computeOdds,
  currentPlayer,
  rollVsBank,
  turnDerived,
  type ComboKey,
  type GameState
} from "@farkle/engine";
import { useMemo, useState } from "react";

function OddsPanel({ game }: { game: GameState }) {
  const [open, setOpen] = useState(false);
  const { turnScore, diceRemaining } = turnDerived(game);
  const odds = useMemo(
    () => (diceRemaining > 0 ? computeOdds(diceRemaining, game.ruleset) : null),
    [diceRemaining, game.ruleset]
  );

  if (!odds) {
    // Hot dice off and every die scored: nothing left to roll.
    return <div className="odds-strip static">No dice left to roll. Bank it!</div>;
  }

  const risk = odds.pFarkle * 100;
  const riskTier = risk < 10 ? "low" : risk < 35 ? "mid" : "high";
  const net = rollVsBank(odds, turnScore);
  const ranked = Object.entries(odds.comboProbabilities)
    .filter(([, p]) => p > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <>
      <button
        type="button"
        className={`odds-strip ${riskTier}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>
          Farkle risk <strong>{risk.toFixed(1)}%</strong> · roll EV ~
          {Math.round(odds.expectedRollScore)}
        </span>
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="odds-panel">
          <p className="odds-verdict">
            {turnScore === 0
              ? "Nothing at stake yet. Roll away."
              : net >= 0
                ? `Rolling gains ~${Math.round(net)} points on average.`
                : `Banking favored: rolling costs ~${Math.round(-net)} points on average.`}
          </p>
          <ul className="odds-list">
            {ranked.map(([key, p]) => (
              <li key={key}>
                <span>{comboByKey.get(key as ComboKey)?.label}</span>
                <span>{(p * 100).toFixed(p < 0.01 ? 2 : 1)}%</span>
              </li>
            ))}
          </ul>
          <p className="odds-note">
            Exact odds for the next roll of {odds.diceCount} dice under this game's rules.
          </p>
        </div>
      )}
    </>
  );
}

interface Props {
  game: GameState;
  onScore: (key: ComboKey) => void;
  onUndo: () => void;
  onFarkle: () => void;
  onBank: () => void;
}

export default function GameScreen({ game, onScore, onUndo, onFarkle, onBank }: Props) {
  const active = currentPlayer(game);
  const { turnScore, diceRemaining, hotDiceCount } = turnDerived(game);
  const combos = COMBOS.filter((c) => game.ruleset.comboPoints[c.key] != null);

  return (
    <main className="screen game">
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
            <span className="sb-score">{p.score.toLocaleString()}</span>
          </li>
        ))}
      </ul>

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
          {!active.onBoard && game.ruleset.entryThreshold > 0 && (
            <span className="hint"> (need {game.ruleset.entryThreshold} to get on the board)</span>
          )}
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

        <div className="turn-actions">
          <button type="button" className="secondary" disabled={!canUndo(game)} onClick={onUndo}>
            ↩️ Undo
          </button>
          <button type="button" className="danger" onClick={onFarkle}>
            💥 Farkle
          </button>
          <button type="button" className="primary" disabled={!canBank(game)} onClick={onBank}>
            🏦 Bank {turnScore > 0 ? turnScore.toLocaleString() : ""}
          </button>
        </div>
      </section>

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
    </main>
  );
}
