import {
  comboByKey,
  computeOdds,
  currentPlayer,
  rollVsBank,
  turnDerived,
  type ComboKey,
  type GameState
} from "@farkle/engine";
import { useMemo, useState } from "react";

const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 10 <= 3 ? n % 10 : 0]}`;

export default function OddsPanel({ game }: { game: GameState }) {
  const [open, setOpen] = useState(false);
  const { turnScore, nextRollDice } = turnDerived(game);
  const odds = useMemo(
    () => (nextRollDice > 0 ? computeOdds(nextRollDice, game.ruleset) : null),
    [nextRollDice, game.ruleset]
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
          {turnScore > 0 &&
            (() => {
              const me = currentPlayer(game);
              const projected = me.score + turnScore;
              const rivals = game.players.filter((p) => p.id !== me.id);
              const place = 1 + rivals.filter((p) => p.score > projected).length;
              const leader = Math.max(...rivals.map((p) => p.score), 0);
              return (
                <p className="odds-place">
                  🏦 Bank now → <strong>{ordinal(place)} place</strong> at{" "}
                  {projected.toLocaleString()}
                  {place > 1 && `, ${(leader - projected).toLocaleString()} behind`}
                </p>
              );
            })()}
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
