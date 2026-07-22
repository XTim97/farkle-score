import { useEffect, useState } from "react";
import { createPlayer, deletePlayer, fetchPlayers, type ApiPlayer } from "../api.js";

interface Props {
  onBack: () => void;
  onContinue: (selected: ApiPlayer[]) => void;
}

export default function PlayerSelectScreen({ onBack, onContinue }: Props) {
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers()
      .then((list) => {
        setPlayers(list);
        // Exactly two saved players: both are obviously playing.
        if (list.length === 2) setSelected(new Set(list.map((p) => p.id)));
      })
      .catch(() => setError("Could not load saved players"));
  }, []);

  function toggle(id: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await createPlayer(trimmed);
      setPlayers((list) =>
        list.some((p) => p.id === created.id)
          ? list
          : [...list, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelected((s) => new Set(s).add(created.id));
      setName("");
    } catch {
      setError("Could not add player");
    }
  }

  async function remove(id: number) {
    try {
      await deletePlayer(id);
      setPlayers((list) => list.filter((p) => p.id !== id));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    } catch {
      setError("Could not remove player (they may have recorded games)");
    }
  }

  const chosen = players.filter((p) => selected.has(p.id));

  return (
    <main className="screen">
      <h1>Who's Playing?</h1>
      {error && <p className="error">{error}</p>}
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.id}>
            <label>
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span>{p.name}</span>
            </label>
            <button
              type="button"
              className="icon"
              aria-label={`Remove ${p.name}`}
              onClick={() => void remove(p.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="add-player"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          aria-label="Player name"
        />
        <button type="submit" className="secondary">
          Add Player
        </button>
      </form>
      <div className="stack">
        <button
          type="button"
          className="primary big"
          disabled={chosen.length < 2}
          onClick={() => onContinue(chosen)}
        >
          {chosen.length < 2 ? "Select at least 2 players" : `Continue with ${chosen.length}`}
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
