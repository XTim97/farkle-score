import { DEFAULT_RULESET, type Ruleset } from "@farkle/engine";
import { useEffect, useState } from "react";
import { fetchRulesets, type ApiPlayer, type ApiRuleset } from "../api.js";

interface Props {
  players: ApiPlayer[];
  onBack: () => void;
  onHelp: () => void;
  onStart: (ordered: ApiPlayer[], ruleset: Ruleset, firstIndex?: number) => void;
}

const LAST_RULESET_KEY = "farkle-last-ruleset";

export default function ArrangeOrderScreen({ players, onBack, onHelp, onStart }: Props) {
  const [order, setOrder] = useState(players);
  const [picked, setPicked] = useState<number | null>(null);
  const [rulesets, setRulesets] = useState<ApiRuleset[]>([]);
  /** null = randomize; otherwise the player id who won the roll-off. */
  const [firstId, setFirstId] = useState<number | null>(null);
  const [choice, setChoice] = useState<string>(
    localStorage.getItem(LAST_RULESET_KEY) ?? "default"
  );

  useEffect(() => {
    fetchRulesets()
      .then((list) => {
        setRulesets(list);
        // A remembered custom ruleset may have been deleted since.
        setChoice((c) => (c === "default" || list.some((r) => String(r.id) === c) ? c : "default"));
      })
      .catch(() => setRulesets([]));
  }, []);

  function tap(index: number) {
    if (picked === null) {
      setPicked(index);
      return;
    }
    if (picked !== index) {
      setOrder((list) => {
        const next = [...list];
        const [moved] = next.splice(picked, 1);
        if (moved) next.splice(index, 0, moved);
        return next;
      });
    }
    setPicked(null);
  }

  function start() {
    const custom = rulesets.find((r) => String(r.id) === choice);
    localStorage.setItem(LAST_RULESET_KEY, custom ? choice : "default");
    const firstIndex = firstId == null ? undefined : order.findIndex((p) => p.id === firstId);
    onStart(
      order,
      custom ? custom.config : DEFAULT_RULESET,
      firstIndex === -1 ? undefined : firstIndex
    );
  }

  return (
    <main className="screen">
      <div className="screen-top">
        <button type="button" className="help-btn" aria-label="Help" onClick={onHelp}>
          ?
        </button>
      </div>
      <h1>Table Order</h1>
      <p className="hint">
        Match the seating around the table. Tap a player, then tap where they sit.
      </p>
      <ol className="order-list">
        {order.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className={`order-slot ${picked === i ? "picked" : ""}`}
              onClick={() => tap(i)}
            >
              <span className="seat">{i + 1}</span>
              {p.name}
            </button>
          </li>
        ))}
      </ol>

      <div className="field">
        <span>First player (roll a die, or let the app pick)</span>
        <div className="first-picker">
          <button
            type="button"
            className={`pill ${firstId == null ? "selected" : ""}`}
            onClick={() => setFirstId(null)}
          >
            🎲 Random
          </button>
          {order.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pill ${firstId === p.id ? "selected" : ""}`}
              onClick={() => setFirstId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Rules</span>
        <select value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="default">{DEFAULT_RULESET.name} (built-in)</option>
          {rulesets.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <div className="stack">
        <button type="button" className="primary big" onClick={start}>
          {firstId == null
            ? "🎲 Randomize First Player & Start"
            : `🎲 Start (${order.find((p) => p.id === firstId)?.name} goes first)`}
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
