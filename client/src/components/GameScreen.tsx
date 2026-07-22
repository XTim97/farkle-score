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

  return (
    <main className="screen game">
      <div className="screen-top">
        <button type="button" className="help-btn" aria-label="Help" onClick={onHelp}>
          ?
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
              <span className="sb-score">{p.score.toLocaleString()}</span>
              {leaderScore > p.score && (
                <span className="sb-behind">-{(leaderScore - p.score).toLocaleString()}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <section className="turn-panel">
        <div className="turn-head">
          <h2>{active.name}</h2>
          <span className="dice-left" title="Dice remaining">
            {game.turnRolls.length > 1 &&
            game.turnRolls.at(-1)?.events.length === 0 &&
            game.turnRolls.at(-1)?.diceCount === 6
              ? "🔥 Hot dice! Roll all 6"
              : `🎲 × ${diceRemaining}`}
            {hotDiceCount > 0 && <em className="hot"> 🔥{hotDiceCount}</em>}
          </span>
        </div>
        <div className="turn-score">
          Turn: <strong>{turnScore.toLocaleString()}</strong>
          {!active.onBoard && game.ruleset.entryThreshold > 0 && (
            <span className="hint"> (need {game.ruleset.entryThreshold} to get on the board)</span>
          )}
        </div>

        <OddsPanel game={game} variant="scorer" />

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

        <div className="turn-actions">
          <button
            type="button"
            className="secondary"
            disabled={!canRollAgain(game)}
            onClick={onRoll}
          >
            ↻ Roll {canRollAgain(game) ? nextRollDice : ""}
          </button>
          <button type="button" className="primary" disabled={!canBank(game)} onClick={onBank}>
            🏦 Bank {turnScore > 0 ? turnScore.toLocaleString() : ""}
          </button>
          <button type="button" className="secondary" disabled={!canUndo(game)} onClick={onUndo}>
            ↩️ Undo
          </button>
          <button
            type="button"
            className="danger"
            disabled={!canFarkle(game)}
            onClick={onFarkle}
          >
            💥 Farkle
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
