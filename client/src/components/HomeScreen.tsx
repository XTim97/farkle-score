interface Props {
  onNewGame: () => void;
  onInstructions: () => void;
  onRulesets: () => void;
  onStats: () => void;
  onHistory: () => void;
  onWatch: () => void;
  showIntro: boolean;
  onDismissIntro: () => void;
  onGettingStarted: () => void;
}

export default function HomeScreen({
  onNewGame,
  onInstructions,
  onRulesets,
  onStats,
  onHistory,
  onWatch,
  showIntro,
  onDismissIntro,
  onGettingStarted
}: Props) {
  return (
    <main className="screen home">
      <h1>🎲 Farkle Score</h1>
      <p className="tagline">Scorekeeper, house rules and all.</p>

      {showIntro && (
        <section className="intro-card">
          <h2>👋 First time here?</h2>
          <p>
            One phone keeps score: tap the combos each player keeps, ↻ Roll when they re-roll,
            Bank when they stop. Everyone else can watch live on their own phone.
          </p>
          <div className="intro-actions">
            <button type="button" className="primary" onClick={onGettingStarted}>
              🚀 Getting Started Guide
            </button>
            <button type="button" className="secondary" onClick={onDismissIntro}>
              Got it
            </button>
          </div>
        </section>
      )}

      <div className="stack">
        <button type="button" className="primary big" onClick={onNewGame}>
          New Game
        </button>
        <button type="button" className="secondary" onClick={onWatch}>
          📺 Watch a Game
        </button>
        <button type="button" className="secondary" onClick={onStats}>
          📊 Stats
        </button>
        <button type="button" className="secondary" onClick={onHistory}>
          🕘 Game History
        </button>
        <button type="button" className="secondary" onClick={onRulesets}>
          ⚙️ House Rules
        </button>
        <button type="button" className="secondary" onClick={onInstructions}>
          📖 Help &amp; Guide
        </button>
      </div>
    </main>
  );
}
