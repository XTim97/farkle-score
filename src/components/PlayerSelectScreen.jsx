export default function PlayerSelectScreen({
  savedPlayers,
  selectedNames,
  newPlayerName,
  playersMin,
  onToggleSavedPlayer,
  onRemoveSavedPlayer,
  onGeneratePlayers,
  onNewPlayerNameChange,
  onAddSavedPlayer,
  onContinue
}) {
  return (
    <section className="panel">
      <h1>Pick Players</h1>

      {savedPlayers.length === 0 ? (
        <div className="empty-state">
          <p>No saved players yet.</p>
          <button type="button" onClick={onGeneratePlayers}>
            Generate Players
          </button>
        </div>
      ) : (
        <div className="saved-player-list">
          {savedPlayers.map((name) => (
            <label key={name} className="saved-player-row">
              <input
                type="checkbox"
                checked={selectedNames.includes(name)}
                onChange={() => onToggleSavedPlayer(name)}
              />

              <span>{name}</span>

              <button
                type="button"
                className="remove"
                onClick={(event) => {
                  event.preventDefault();
                  onRemoveSavedPlayer(name);
                }}
              >
                ×
              </button>
            </label>
          ))}
        </div>
      )}

      <div className="add-player-row">
        <input
          value={newPlayerName}
          placeholder="New player name"
          onChange={(event) => onNewPlayerNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAddSavedPlayer();
          }}
        />

        <button type="button" onClick={onAddSavedPlayer}>
          Add Player
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={selectedNames.length < playersMin}
      >
        Continue
      </button>
    </section>
  );
}
