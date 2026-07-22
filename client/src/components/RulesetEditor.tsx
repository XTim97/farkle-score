import {
  COMBOS,
  DEFAULT_RULESET,
  validateRuleset,
  type ComboKey,
  type Ruleset
} from "@farkle/engine";
import { useState } from "react";
import { createRuleset, updateRuleset, type ApiRuleset } from "../api.js";

interface Props {
  /** null = creating a new ruleset (seeded from the default). */
  editing: ApiRuleset | null;
  onDone: () => void;
}

export default function RulesetEditor({ editing, onDone }: Props) {
  const [config, setConfig] = useState<Ruleset>(
    editing
      ? structuredClone(editing.config)
      : { ...structuredClone(DEFAULT_RULESET), name: "" }
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Ruleset>(key: K, value: Ruleset[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function setNumber<K extends "winningScore" | "entryThreshold" | "threeFarklePenalty">(
    key: K,
    raw: string
  ) {
    set(key, raw === "" ? 0 : Number(raw));
  }

  function toggleCombo(key: ComboKey, enabled: boolean) {
    setConfig((c) => {
      const comboPoints = { ...c.comboPoints };
      if (enabled) {
        comboPoints[key] =
          DEFAULT_RULESET.comboPoints[key] ??
          COMBOS.find((combo) => combo.key === key)?.points ??
          100;
      } else {
        delete comboPoints[key];
      }
      return { ...c, comboPoints };
    });
  }

  function setComboPoints(key: ComboKey, raw: string) {
    setConfig((c) => ({
      ...c,
      comboPoints: { ...c.comboPoints, [key]: raw === "" ? 0 : Number(raw) }
    }));
  }

  async function save() {
    const problems = validateRuleset(config);
    if (problems.length) {
      setError(problems.join(". "));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) await updateRuleset(editing.id, config);
      else await createRuleset(config);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <main className="screen">
      <h1>{editing ? `Edit ${editing.name}` : "New Ruleset"}</h1>
      {error && <p className="error">{error}</p>}

      <section className="form-panel">
        <label className="field">
          <span>Name</span>
          <input
            value={config.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Armstrong House Rules"
          />
        </label>
        <label className="field">
          <span>Winning score</span>
          <input
            type="number"
            min={1000}
            step={500}
            value={config.winningScore || ""}
            onChange={(e) => setNumber("winningScore", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Entry threshold (0 = off)</span>
          <input
            type="number"
            min={0}
            step={50}
            value={config.entryThreshold || ""}
            onChange={(e) => setNumber("entryThreshold", e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="field">
          <span>Three-farkle penalty (0 = off)</span>
          <input
            type="number"
            min={0}
            step={100}
            value={config.threeFarklePenalty || ""}
            onChange={(e) => setNumber("threeFarklePenalty", e.target.value)}
            placeholder="0"
          />
        </label>
        <label className="field toggle">
          <input
            type="checkbox"
            checked={config.hotDice}
            onChange={(e) => set("hotDice", e.target.checked)}
          />
          <span>Hot dice: scoring all six rolls again</span>
        </label>
        <label className="field toggle">
          <input
            type="checkbox"
            checked={config.finalRound}
            onChange={(e) => set("finalRound", e.target.checked)}
          />
          <span>Final round: everyone gets one last turn</span>
        </label>
      </section>

      <section className="form-panel">
        <h2>Scoring combinations</h2>
        <ul className="combo-edit-list">
          {COMBOS.map((combo) => {
            const points = config.comboPoints[combo.key];
            const enabled = points != null;
            return (
              <li key={combo.key}>
                <label className="combo-toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => toggleCombo(combo.key, e.target.checked)}
                  />
                  <span>{combo.label}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={50}
                  disabled={!enabled}
                  value={enabled && points !== 0 ? points : ""}
                  onChange={(e) => setComboPoints(combo.key, e.target.value)}
                  aria-label={`${combo.label} points`}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="stack">
        <button type="button" className="primary big" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save Ruleset"}
        </button>
        <button type="button" className="secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </main>
  );
}
