function formatTurnAction(action) {
  return `${action.label} (${action.points})`;
}

function formatHistoryEntry(entry) {
  return entry.type === "farkle"
    ? "Farkle (0)"
    : entry.points.toLocaleString();
}

export default function TurnHistory({ currentTurnActions, playerHistory }) {
  return (
    <>
      <div className="history">
        <strong>This turn:</strong>{" "}
        {currentTurnActions.length === 0
          ? "No scoring dice yet"
          : currentTurnActions.map(formatTurnAction).join(", ")}
      </div>

      <div className="history">
        <strong>Plays history:</strong>{" "}
        {playerHistory.length === 0
          ? "No turns yet"
          : playerHistory.map(formatHistoryEntry).join(", ")}
      </div>
    </>
  );
}
