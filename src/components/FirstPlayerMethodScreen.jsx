export default function FirstPlayerMethodScreen({ onRollDice, onRandomize }) {
  return (
    <section className="order-setup first-player-method-screen">
      <h1>Choose Who Goes First</h1>
      <p className="order-help">
        The seating order is locked. Choose how the first player will be selected.
      </p>

      <div className="first-player-method-actions">
        <button type="button" onClick={onRollDice}>
          Roll One Die
        </button>
        <button type="button" className="secondary" onClick={onRandomize}>
          Randomize
        </button>
      </div>
    </section>
  );
}
