import { useEffect, useState } from "react";

export default function PlayerSelectScreen({
  savedPlayers,
  selectedNames,
  newPlayerName,
  playersMin,
  onToggleSavedPlayer,
  onRemoveSavedPlayer,
  onNewPlayerNameChange,
  onAddSavedPlayer,
  onContinue
}) {
  const [isAddingNewPlayer, setIsAddingNewPlayer] = useState(false);
  const hasEnoughSavedPlayers = savedPlayers.length >= playersMin;
  const selectedEnoughPlayers = selectedNames.length >= playersMin;
  const showPlayerEntry = !hasEnoughSavedPlayers || isAddingNewPlayer;

  useEffect(() => {
    if (!hasEnoughSavedPlayers) {
      setIsAddingNewPlayer(false);
    }
  }, [hasEnoughSavedPlayers]);

  function handleAddSavedPlayer() {
    const hasNameToAdd = newPlayerName.trim().length > 0;

    onAddSavedPlayer();

    if (hasEnoughSavedPlayers && hasNameToAdd) {
      setIsAddingNewPlayer(false);
    }
  }

  return (
    <section className="panel">
      <h1>Pick Players</h1>

      {savedPlayers.length === 0 ? (
        <div className="empty-state">
          <p>No saved players yet.</p>
          <p>Enter the players who will be playing this game.</p>
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
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            </label>
          ))}
        </div>
      )}

      {showPlayerEntry && (
        <>
          <div className="add-player-row">
            <input
              value={newPlayerName}
              placeholder="Player name"
              onChange={(event) => onNewPlayerNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAddSavedPlayer();
              }}
            />

            <button type="button" onClick={handleAddSavedPlayer}>
              Add Player
            </button>
          </div>

          {newPlayerName.trim().length === 0 && (
            <p className="add-player-prompt" role="status" aria-live="polite">
              Enter player name, then press Add Player button
            </p>
          )}

          {!hasEnoughSavedPlayers && (
            <p className="player-count-help">
              Add at least {playersMin} players to continue.
            </p>
          )}
        </>
      )}

      {hasEnoughSavedPlayers && !showPlayerEntry && !selectedEnoughPlayers && (
        <p className="player-count-help">
          Select at least {playersMin} players to start the game.
        </p>
      )}

      {hasEnoughSavedPlayers && !showPlayerEntry && (
        <button
          type="button"
          className="secondary new-player-button"
          onClick={() => setIsAddingNewPlayer(true)}
        >
          ➕ New Player
        </button>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!selectedEnoughPlayers}
      >
        🎲 Start Game
      </button>
    </section>
  );
}
