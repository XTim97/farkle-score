interface Props {
  onNewGame: () => void;
  onInstructions: () => void;
  onRulesets: () => void;
}

export default function HomeScreen({ onNewGame, onInstructions, onRulesets }: Props) {
  return (
    <main className="screen home">
      <h1>🎲 Farkle Score</h1>
      <p className="tagline">Scorekeeper, house rules and all.</p>
      <div className="stack">
        <button type="button" className="primary big" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="secondary" onClick={onRulesets}>
          ⚙️ House Rules
        </button>
        <button type="button" className="secondary" onClick={onInstructions}>
          📖 Instructions
        </button>
      </div>
    </main>
  );
}
