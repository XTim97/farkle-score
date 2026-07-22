import { useState } from "react";
import type { ApiPlayer } from "../api.js";

interface Props {
  players: ApiPlayer[];
  onBack: () => void;
  onStart: (ordered: ApiPlayer[]) => void;
}

export default function ArrangeOrderScreen({ players, onBack, onStart }: Props) {
  const [order, setOrder] = useState(players);
  const [picked, setPicked] = useState<number | null>(null);

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

  return (
    <main className="screen">
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
      <div className="stack">
        <button type="button" className="primary big" onClick={() => onStart(order)}>
          🎲 Randomize First Player &amp; Start
        </button>
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
