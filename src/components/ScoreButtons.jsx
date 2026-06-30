import { scoringActions } from "../data/scoringActions";

export default function ScoreButtons({ disabled, onAddScoringAction }) {
  return (
    <section className="score-buttons">
      {scoringActions.map((action) => (
        <button
          key={action.label}
          type="button"
          className="score-button"
          onClick={() => onAddScoringAction(action)}
          disabled={disabled}
        >
          {action.label} = {action.points.toLocaleString()}
        </button>
      ))}
    </section>
  );
}
