import { comboByKey, type TurnRoll } from "@farkle/engine";
import { Fragment } from "react";

/** The turn's kept combos, with a ↻ divider marking each re-roll. */
export default function RollChips({ rolls }: { rolls: TurnRoll[] }) {
  if (rolls.every((r) => r.events.length === 0) && rolls.length === 1) return null;
  return (
    <div className="event-chips">
      {rolls.map((roll, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="chip roll-chip">↻ {roll.diceCount}</span>}
          {roll.events.map((e, j) => (
            <span key={j} className="chip">
              {comboByKey.get(e.comboKey)?.label} +{e.points}
            </span>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
