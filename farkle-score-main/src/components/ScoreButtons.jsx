import { scoringActions } from "../data/scoringActions";

const SCORE_BUTTON_STYLES = {
  single: {
    50: { background: "#fef08a", active: "#facc15", text: "#422006" },
    100: { background: "#fde047", active: "#eab308", text: "#422006" }
  },
  "three-kind": {
    200: { background: "#7dd3fc", active: "#38bdf8", text: "#082f49" },
    300: { background: "#38bdf8", active: "#0ea5e9", text: "#082f49" },
    400: { background: "#0ea5e9", active: "#0284c7", text: "#f0f9ff" },
    500: { background: "#0284c7", active: "#0369a1", text: "#f0f9ff" },
    600: { background: "#0369a1", active: "#075985", text: "#f0f9ff" }
  },
  "three-ones": {
    300: { background: "#bae6fd", active: "#7dd3fc", text: "#082f49" }
  },
  "three-twos": {
    200: { background: "#7dd3fc", active: "#38bdf8", text: "#082f49" }
  },
  "three-threes": {
    300: { background: "#38bdf8", active: "#0ea5e9", text: "#082f49" }
  },
  "multi-kind": {
    1000: { background: "#d8b4fe", active: "#a855f7", text: "#3b0764" },
    2000: { background: "#c084fc", active: "#9333ea", text: "#3b0764" },
    3000: { background: "#a855f7", active: "#7e22ce", text: "#faf5ff" }
  },
  "five-straight": {
    850: { background: "#f0a7b8", active: "#e87993", text: "#4a1020" }
  },
  "three-two-kind": {
    850: { background: "#5cc5bd", active: "#2aa79e", text: "#073b37" }
  },
  "three-pairs": {
    1500: { background: "#b8c47a", active: "#9daa62", text: "#26310f" }
  },
  "large-straight": {
    1500: { background: "#d946ef", active: "#c026d3", text: "#ffffff" }
  },
  special: {
    1500: { background: "#fed7aa", active: "#fb923c", text: "#431407" },
    2500: { background: "#fb923c", active: "#ea580c", text: "#431407" }
  }
};

function getScoreButtonGroup(action) {
  if (action.label === "Large Straight") {
    return "large-straight";
  }

  if (action.label === "Three Pairs") {
    return "three-pairs";
  }

  if (action.label === "Three 1s") {
    return "three-ones";
  }

  if (action.label === "Three 2s") {
    return "three-twos";
  }

  if (action.label === "Three 3s") {
    return "three-threes";
  }

  if (action.label === "Small Straight") {
    return "five-straight";
  }

  if (action.label === "Full House") {
    return "three-two-kind";
  }

  if (action.label.startsWith("Single")) {
    return "single";
  }

  if (action.label.startsWith("Three")) {
    return action.label === "Three Pairs" ? "special" : "three-kind";
  }

  if (["Four of a Kind", "Five of a Kind", "Six of a Kind"].includes(action.label)) {
    return "multi-kind";
  }

  return "special";
}

function getScoreButtonStyle(action, group) {
  const colorSet = SCORE_BUTTON_STYLES[group]?.[action.points];

  if (!colorSet) {
    return {};
  }

  return {
    "--score-button-bg": colorSet.background,
    "--score-button-bg-active": colorSet.active,
    "--score-button-text": colorSet.text
  };
}

export default function ScoreButtons({ disabled, onAddScoringAction }) {
  return (
    <section className="score-buttons">
      {scoringActions.map((action) => {
        const group = getScoreButtonGroup(action);

        return (
          <button
            key={action.label}
            type="button"
            className={`score-button score-button-${group}`}
            style={getScoreButtonStyle(action, group)}
            onClick={() => onAddScoringAction(action)}
            disabled={disabled}
          >
            <span className="score-button-label">{action.label}</span>
            <span className="score-button-points">{action.points.toLocaleString()}</span>
          </button>
        );
      })}
    </section>
  );
}
