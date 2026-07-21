import { useRef, useState } from "react";

export default function ArrangeOrderScreen({
  starterMessage,
  orderedSetupPlayers,
  getPlayerName,
  onReorderOrderPlayer,
  onBeginGame
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const lastPointerActionTime = useRef(0);
  const canReorder = orderedSetupPlayers.length > 2;

  function moveOrSelectPlayer(playerId) {
    if (!canReorder) return;

    if (!selectedPlayerId || selectedPlayerId === playerId) {
      setSelectedPlayerId(playerId);
      return;
    }

    onReorderOrderPlayer(selectedPlayerId, playerId);
    setSelectedPlayerId(null);
  }

  function handlePointerUp(event, playerId) {
    event.preventDefault();
    lastPointerActionTime.current = Date.now();
    moveOrSelectPlayer(playerId);
  }

  function handleClick(playerId) {
    if (Date.now() - lastPointerActionTime.current < 700) return;
    moveOrSelectPlayer(playerId);
  }

  function clearSelection() {
    setSelectedPlayerId(null);
  }

  return (
    <section className="order-setup">
      <h1>Arrange Table Order</h1>

      <section className="starter-message">{starterMessage}</section>

      {canReorder ? (
        <p className="order-help">
          Tap a player to select them, then tap the table position where you want
          to move them. No dragging is needed.
        </p>
      ) : (
        <p className="order-help">The order is automatic for a two-player game.</p>
      )}

      <div className="order-list">
        {orderedSetupPlayers.map((player, index) => {
          const isSelected = selectedPlayerId === player.id;
          const hasSelection = selectedPlayerId && !isSelected;

          return (
            <button
              key={player.id}
              type="button"
              className={`order-item tap-order-item ${
                isSelected ? "selected-order-item" : ""
              } ${hasSelection ? "move-target-order-item" : ""}`}
              onPointerUp={(event) => handlePointerUp(event, player.id)}
              onClick={() => handleClick(player.id)}
              disabled={!canReorder}
            >
              <span>
                {index + 1}. {getPlayerName(player, index)}
              </span>

              {canReorder ? (
                <strong className="move-handle">
                  {isSelected ? "Selected" : hasSelection ? "Move here" : "Tap to select"}
                </strong>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedPlayerId ? (
        <button type="button" className="secondary" onClick={clearSelection}>
          Cancel Move
        </button>
      ) : null}

      <button type="button" onClick={onBeginGame}>
        Randomize First Player
      </button>
    </section>
  );
}
