import { DEFAULT_RULESET } from "@farkle/engine";
import { useEffect, useState } from "react";
import { deleteRuleset, fetchRulesets, type ApiRuleset } from "../api.js";

interface Props {
  onBack: () => void;
  onEdit: (ruleset: ApiRuleset | null) => void;
}

export default function RulesetsScreen({ onBack, onEdit }: Props) {
  const [rulesets, setRulesets] = useState<ApiRuleset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRulesets()
      .then(setRulesets)
      .catch(() => setError("Could not load rulesets"));
  }, []);

  async function remove(id: number) {
    try {
      await deleteRuleset(id);
      setRulesets((list) => list.filter((r) => r.id !== id));
    } catch {
      setError("Could not delete ruleset");
    }
  }

  return (
    <main className="screen">
      <h1>⚙️ House Rules</h1>
      <p className="hint">Rules are chosen per game when you start one.</p>
      {error && <p className="error">{error}</p>}

      <ul className="ruleset-list">
        <li>
          <div className="rs-info">
            <strong>{DEFAULT_RULESET.name}</strong>
            <span className="rs-summary">
              Built-in · to {DEFAULT_RULESET.winningScore.toLocaleString()}
            </span>
          </div>
        </li>
        {rulesets.map((r) => (
          <li key={r.id}>
            <div className="rs-info">
              <strong>{r.name}</strong>
              <span className="rs-summary">
                to {r.config.winningScore.toLocaleString()}
                {r.config.entryThreshold > 0 && ` · entry ${r.config.entryThreshold}`}
                {r.config.threeFarklePenalty > 0 &&
                  ` · 3-farkle -${r.config.threeFarklePenalty}`}
                {!r.config.hotDice && " · no hot dice"}
              </span>
            </div>
            <div className="rs-actions">
              <button type="button" className="secondary" onClick={() => onEdit(r)}>
                Edit
              </button>
              <button
                type="button"
                className="icon"
                aria-label={`Delete ${r.name}`}
                onClick={() => void remove(r.id)}
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="stack">
        <button type="button" className="primary big" onClick={() => onEdit(null)}>
          ＋ New Ruleset
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
