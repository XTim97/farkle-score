import { COMBOS, DEFAULT_RULESET } from "@farkle/engine";

interface Props {
  onBack: () => void;
}

export default function InstructionsScreen({ onBack }: Props) {
  return (
    <main className="screen instructions">
      <h1>📖 How to Play</h1>

      <section>
        <h2>Basics</h2>
        <p>
          On your turn, roll all six dice. Tap a scoring button for each combination you keep;
          you can tap several from the same roll. Then tap <strong>↻ Roll</strong> to throw the
          remaining dice, or <strong>Bank</strong> to end your turn and keep the points. If a
          roll has no scoring dice, tap <strong>Farkle</strong>: the turn ends and the whole
          turn's points are lost.
        </p>
      </section>

      <section>
        <h2>Hot dice</h2>
        <p>
          Score all six dice and you roll all six again, still building the same turn. The 🎲
          counter shows how many dice you have left; 🔥 marks how many times you've gone hot.
        </p>
      </section>

      <section>
        <h2>Winning</h2>
        <p>
          Reach {DEFAULT_RULESET.winningScore.toLocaleString()} and every other player gets one
          final turn. Highest total wins.
        </p>
      </section>

      <section>
        <h2>Scoring</h2>
        <table className="scoring-table">
          <thead>
            <tr>
              <th>Combination</th>
              <th>Points</th>
              <th>Dice</th>
            </tr>
          </thead>
          <tbody>
            {COMBOS.map((c) => (
              <tr key={c.key}>
                <td>{c.label}</td>
                <td>{(DEFAULT_RULESET.comboPoints[c.key] ?? c.points).toLocaleString()}</td>
                <td>{c.diceUsed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <button type="button" className="secondary" onClick={onBack}>
        ← Back to Home
      </button>
    </main>
  );
}
