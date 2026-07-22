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

/** What the collapsed strip shows while it's this player's turn. */
type OddsMode = "hidden" | "farkle";

const PREFS_KEY = "farkle-odds-prefs";

function loadPrefs(): Record<string, OddsMode> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Record<string, OddsMode>;
  } catch {
    return {};
  }
}

interface Props {
  game: GameState;
  /** scorer: per-player buried stats. viewer: always-on strip for spectators. */
  variant?: "scorer" | "viewer";
}

export default function OddsPanel({ game, variant = "viewer" }: Props) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, OddsMode>>(loadPrefs);
  const { turnScore, nextRollDice } = turnDerived(game);
  const odds = useMemo(
    () => (nextRollDice > 0 ? computeOdds(nextRollDice, game.ruleset) : null),
    [nextRollDice, game.ruleset]
  );

  if (!odds) {
    // Hot dice off and every die scored: nothing left to roll.
    return <div className="odds-strip static">No dice left to roll. Bank it!</div>;
  }

  const active = game.phase !== "finished" ? currentPlayer(game) : null;
  const mode: OddsMode =
    variant === "scorer" ? (active && prefs[active.id]) || "hidden" : "farkle";

  function setMode(next: OddsMode) {
    if (!active) return;
    const updated = { ...prefs, [active.id]: next };
    setPrefs(updated);
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  }

  const risk = odds.pFarkle * 100;
  const riskTier = risk < 10 ? "low" : risk < 35 ? "mid" : "high";
  const net = rollVsBank(odds, turnScore);
  const ranked = Object.entries(odds.comboProbabilities)
    .filter(([, p]) => p > 0)
    .sort(([, a], [, b]) => b - a);

  const collapsedLabel =
    mode === "farkle" ? (
      <span>
        Farkle risk <strong>{risk.toFixed(1)}%</strong>
        {variant === "viewer" && <> · roll EV ~{Math.round(odds.expectedRollScore)}</>}
      </span>
    ) : (
      <span>📊 Stats</span>
    );

  return (
    <>
      <button
        type="button"
        className={`odds-strip ${mode === "farkle" ? riskTier : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {collapsedLabel}
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="odds-panel">
          <p className="odds-verdict">
            Farkle risk {risk.toFixed(1)}% · roll EV ~{Math.round(odds.expectedRollScore)}
          </p>
          <p className="odds-verdict">
            {turnScore === 0
              ? "Nothing at stake yet. Roll away."
              : net >= 0
                ? `Rolling gains ~${Math.round(net)} points on average.`
                : `Banking favored: rolling costs ~${Math.round(-net)} points on average.`}
          </p>
          {turnScore > 0 &&
            active &&
            (() => {
              const projected = active.score + turnScore;
              const rivals = game.players.filter((p) => p.id !== active.id);
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
          {variant === "scorer" && active && (
            <div className="odds-pref">
              <span className="odds-pref-label">Always show for {active.name}:</span>
              <div className="first-picker">
                <button
                  type="button"
                  className={`pill ${mode === "hidden" ? "selected" : ""}`}
                  onClick={() => setMode("hidden")}
                >
                  Nothing
                </button>
                <button
                  type="button"
                  className={`pill ${mode === "farkle" ? "selected" : ""}`}
                  onClick={() => setMode("farkle")}
                >
                  Farkle %
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
