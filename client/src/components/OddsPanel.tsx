import {
  comboByKey,
  computeOdds,
  rollVsBank,
  turnDerived,
  type ComboKey,
  type GameState
} from "@farkle/engine";
import { useMemo, useState } from "react";

export default function OddsPanel({ game }: { game: GameState }) {
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
