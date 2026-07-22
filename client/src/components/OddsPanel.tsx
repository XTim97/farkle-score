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

/** Compact combo names for the top-odds row. */
const SHORT_LABEL: Record<string, string> = {
  single1: "1s",
  single5: "5s",
  triple1: "1×3",
  triple2: "2×3",
  triple3: "3×3",
  triple4: "4×3",
  triple5: "5×3",
  triple6: "6×3",
  fourOfAKind: "4oak",
  fiveOfAKind: "5oak",
  sixOfAKind: "6oak",
  fullHouse: "FH",
  threePairs: "3pr",
  fourOfAKindPlusPair: "4+2",
  twoTriplets: "2trip",
  smallStraight: "str5",
  largeStraight: "str6"
};

/** Always-shown rows a player can enable; any combination. */
type OddsItem = "farkle" | "top" | "coach";
const ITEM_ORDER: OddsItem[] = ["farkle", "top", "coach"];
const ITEM_LABEL: Record<OddsItem, string> = {
  farkle: "Farkle %",
  top: "Top odds",
  coach: "Coach"
};

const PREFS_KEY = "farkle-odds-prefs";

function loadPrefs(): Record<string, OddsItem[]> {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Record<
      string,
      unknown
    >;
    const out: Record<string, OddsItem[]> = {};
    for (const [id, value] of Object.entries(raw)) {
      // Migrate the old single-mode string format.
      if (typeof value === "string") {
        out[id] = value === "hidden" ? [] : [value as OddsItem];
      } else if (Array.isArray(value)) {
        out[id] = value.filter((v): v is OddsItem => ITEM_ORDER.includes(v as OddsItem));
      }
    }
    return out;
  } catch {
    return {};
  }
}

interface Props {
  game: GameState;
  /** scorer: per-player pinned rows + Stats dropdown. viewer: always-on strip. */
  variant?: "scorer" | "viewer";
}

export default function OddsPanel({ game, variant = "viewer" }: Props) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, OddsItem[]>>(loadPrefs);
  const { turnScore, nextRollDice } = turnDerived(game);
  const odds = useMemo(
    () => (nextRollDice > 0 ? computeOdds(nextRollDice, game.ruleset) : null),
    [nextRollDice, game.ruleset]
  );

  if (!odds) {
    // Hot dice off and every die scored: nothing left to roll.
    return <div className="odds-strip info static">No dice left to roll. Bank it!</div>;
  }

  const active = game.phase !== "finished" ? currentPlayer(game) : null;
  const selected: OddsItem[] = variant === "scorer" && active ? (prefs[active.id] ?? []) : [];

  function toggleItem(item: OddsItem) {
    if (!active) return;
    const current = prefs[active.id] ?? [];
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
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

  const topOutcomes = [
    { label: "💥", p: odds.pFarkle },
    ...ranked.map(([key, p]) => ({ label: SHORT_LABEL[key] ?? key, p }))
  ]
    .sort((a, b) => b.p - a.p)
    .slice(0, 3);

  const itemRow = (item: OddsItem) => {
    if (item === "farkle") {
      return (
        <div key={item} className={`odds-strip info ${riskTier}`}>
          <span>
            Farkle risk <strong>{risk.toFixed(1)}%</strong>
          </span>
        </div>
      );
    }
    if (item === "top") {
      return (
        <div key={item} className={`odds-strip info ${riskTier}`}>
          <span>
            {topOutcomes.map((o, i) => (
              <span key={o.label}>
                {i > 0 && " · "}
                {o.label} <strong>{(o.p * 100).toFixed(0)}%</strong>
              </span>
            ))}
          </span>
        </div>
      );
    }
    return (
      <div
        key={item}
        className={`odds-strip info ${turnScore === 0 || net >= 0 ? "low" : "high"}`}
      >
        <span>
          {turnScore === 0
            ? "🧭 Roll away"
            : net >= 0
              ? `🧭 Roll (+${Math.round(net)} avg)`
              : `🧭 Bank (${Math.round(net)} avg)`}
        </span>
      </div>
    );
  };

  return (
    <>
      {variant === "scorer" && ITEM_ORDER.filter((i) => selected.includes(i)).map(itemRow)}
      <button
        type="button"
        className={`odds-strip ${variant === "viewer" ? riskTier : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {variant === "viewer" ? (
          <span>
            Farkle risk <strong>{risk.toFixed(1)}%</strong> · roll EV ~
            {Math.round(odds.expectedRollScore)}
          </span>
        ) : (
          <span>📊 Stats</span>
        )}
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
              <span className="odds-pref-label">
                Always show for {active.name} (pick any):
              </span>
              <div className="first-picker">
                {ITEM_ORDER.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`pill ${selected.includes(item) ? "selected" : ""}`}
                    onClick={() => toggleItem(item)}
                  >
                    {ITEM_LABEL[item]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
