import { COMBOS, DEFAULT_RULESET } from "@farkle/engine";
import { useState, type ReactNode } from "react";

export type HelpTopicId =
  | "getting-started"
  | "setup"
  | "order-first"
  | "turn-flow"
  | "scoring-table"
  | "hot-dice"
  | "odds"
  | "house-rules"
  | "winning"
  | "live"
  | "stats"
  | "history";

interface HelpTopic {
  id: HelpTopicId;
  icon: string;
  title: string;
  body: ReactNode;
}

const TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    icon: "🚀",
    title: "Getting Started",
    body: (
      <>
        <p>Your first game, start to finish:</p>
        <ol>
          <li>
            Tap <strong>New Game</strong> and add everyone by name. Players are saved for next
            time.
          </li>
          <li>
            Arrange the list to match seating around the table, then pick who goes first (or
            let the app choose).
          </li>
          <li>
            The scorer keeps the phone. On each turn: roll the real dice, tap the combos the
            player keeps, then tap <strong>↻ Roll</strong> when they re-roll or{" "}
            <strong>🏦 Bank</strong> when they stop.
          </li>
          <li>
            Rolled nothing scorable? Tap <strong>💥 Farkle</strong>: the turn is over and its
            points are lost.
          </li>
          <li>
            First to {DEFAULT_RULESET.winningScore.toLocaleString()} triggers the final round.
            Highest total wins, and the game saves itself to Stats and History.
          </li>
        </ol>
        <p>
          Optional: tap the <strong>📺 Live</strong> badge during a game so everyone else can
          watch the scoreboard from their own phone.
        </p>
      </>
    )
  },
  {
    id: "setup",
    icon: "👥",
    title: "Players",
    body: (
      <>
        <p>
          Add a player once and they are saved forever, along with their stats. Select at
          least two saved players to start a game; the × removes a saved name.
        </p>
        <p>If exactly two players are saved, both are selected automatically.</p>
      </>
    )
  },
  {
    id: "order-first",
    icon: "🪑",
    title: "Table Order & First Player",
    body: (
      <>
        <p>
          Put players in the same order they sit around the table: tap a player, then tap the
          seat to move them to. Play proceeds down the list and wraps around.
        </p>
        <p>
          <strong>First player:</strong> if your house rolls a die for it, tap the winner in
          the pill row. Leave it on 🎲 Random to let the app decide.
        </p>
        <p>The Rules picker on this screen chooses which house rules the game uses.</p>
      </>
    )
  },
  {
    id: "turn-flow",
    icon: "🎲",
    title: "Scoring a Turn",
    body: (
      <>
        <p>A turn is a loop of roll, keep, decide:</p>
        <ol>
          <li>Roll the dice (six to start).</li>
          <li>
            Tap a scoring button for each combo the player sets aside. You can tap several
            from one roll; buttons gray out when too few dice remain.
          </li>
          <li>
            Tap <strong>↻ Roll</strong> to throw the remaining dice (the button shows how
            many), or <strong>🏦 Bank</strong> to end the turn and keep the points.
          </li>
        </ol>
        <p>
          <strong>💥 Farkle</strong> is for a roll with nothing scorable: the whole turn's
          points are lost. It is only available on a fresh roll, because once you keep dice
          from a roll it was not a farkle.
        </p>
        <p>
          <strong>↩️ Undo</strong> takes back the last tap, whether that was a combo or an
          accidental ↻ Roll.
        </p>
        <p>
          The chip row above the buttons tells the turn's story: kept combos, with an amber
          "↻ 3" chip meaning "re-rolled 3 dice here". Tapping ↻ Roll honestly is what makes
          the luck stats accurate.
        </p>
      </>
    )
  },
  {
    id: "scoring-table",
    icon: "➕",
    title: "Scoring Combinations",
    body: (
      <>
        <p>Default point values (custom rulesets can change any of these):</p>
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
      </>
    )
  },
  {
    id: "hot-dice",
    icon: "🔥",
    title: "Hot Dice",
    body: (
      <p>
        Score all six dice and they come back: the scoring buttons light up again on their
        own, so just roll all six and keep tapping, or Bank to stop. The 🔥 counter shows how
        many times the turn has gone hot. Hot dice can be turned off per ruleset.
      </p>
    )
  },
  {
    id: "odds",
    icon: "📈",
    title: "The Odds Strip",
    body: (
      <>
        <p>
          The colored strip on the turn panel shows the exact chance the next roll farkles
          and the average points a roll of that many dice is worth. Green is safe, amber is
          risky, red is danger.
        </p>
        <p>Tap it to expand:</p>
        <ul>
          <li>
            <strong>Roll vs bank:</strong> whether rolling again gains or loses points on
            average, given what is already at stake.
          </li>
          <li>
            <strong>Bank now:</strong> what place the player would be in if they stopped here.
          </li>
          <li>
            <strong>Per-combo odds:</strong> the chance each combination appears in the next
            roll.
          </li>
        </ul>
        <p>
          All of it is exact math for this game's rules, not simulation. Viewers watching
          live see the same strip.
        </p>
      </>
    )
  },
  {
    id: "house-rules",
    icon: "⚙️",
    title: "House Rules",
    body: (
      <>
        <p>
          The built-in ruleset plays to {DEFAULT_RULESET.winningScore.toLocaleString()} with
          hot dice and a final round. Create your own rulesets to change:
        </p>
        <ul>
          <li>
            <strong>Winning score</strong>, and whether there is a final round.
          </li>
          <li>
            <strong>Entry threshold:</strong> a minimum first bank (commonly 500) to get "on
            the board".
          </li>
          <li>
            <strong>Three-farkle penalty:</strong> lose points after three farkles in a row.
          </li>
          <li>
            <strong>Every combo's point value</strong>, or disable combos your house does not
            play.
          </li>
        </ul>
        <p>
          Rules are chosen per game at the table-order screen, and each finished game
          remembers the rules it was played under, so old stats stay honest even if you edit
          a ruleset later.
        </p>
      </>
    )
  },
  {
    id: "winning",
    icon: "🏁",
    title: "Final Round & Winning",
    body: (
      <>
        <p>
          When a player banks {DEFAULT_RULESET.winningScore.toLocaleString()} or more, every
          other player gets exactly one last turn. Highest total wins; ties go to whoever is
          earlier in the seating order.
        </p>
        <p>
          <strong>Same Players</strong> on the winner screen returns to the table-order
          screen for a new roll-off; <strong>New Players</strong> goes back to player
          selection.
        </p>
      </>
    )
  },
  {
    id: "live",
    icon: "📺",
    title: "Watching Live",
    body: (
      <>
        <p>
          The scorer taps the <strong>📺 Live</strong> badge on the game screen to show a QR
          code and a short game code. Anyone on the same network can scan the QR, or open the
          app, tap <strong>Watch a Game</strong>, and type the code.
        </p>
        <p>
          Viewers see the scoreboard, the current turn, and the odds strip update in real
          time, and reconnect automatically if their phone naps. Rematches keep the same
          code.
        </p>
      </>
    )
  },
  {
    id: "stats",
    icon: "📊",
    title: "Stats, Luck & Caution",
    body: (
      <>
        <p>
          Tap a player's card to expand their numbers. Besides the basics (win rate, average
          turn, farkle rate, best turn and game):
        </p>
        <ul>
          <li>
            <strong>Farkles dodged vs expected:</strong> every roll has an exact farkle
            chance; this compares the farkles the dice owed a player with what actually
            happened. Positive = lucky.
          </li>
          <li>
            <strong>Roll yield:</strong> points kept versus what an average player's dice
            would have given them. Above 100% = the dice were kind.
          </li>
          <li>
            <strong>Avg odds when farkled:</strong> low means genuinely unlucky farkles; high
            means they kept pushing small rolls.
          </li>
          <li>
            <strong>Dice left at bank / risky rolls / rolls per turn / points per roll:</strong>{" "}
            the caution profile: who banks early and who pushes their luck.
          </li>
        </ul>
        <p>
          Luck numbers come from the ↻ Roll tracking, so they cover games played since that
          feature (and only count taps made honestly!).
        </p>
      </>
    )
  },
  {
    id: "history",
    icon: "🕘",
    title: "Game History & Replay",
    body: (
      <p>
        Every finished game is saved. Open one from Game History to see final standings, a
        chart of everyone's score racing over the rounds (penalty dips included), and the
        full turn-by-turn record of who scored what.
      </p>
    )
  }
];

interface Props {
  onBack: () => void;
  initialTopic?: HelpTopicId;
}

export default function InstructionsScreen({ onBack, initialTopic }: Props) {
  const [openTopic, setOpenTopic] = useState<HelpTopicId | null>(
    initialTopic ?? "getting-started"
  );

  return (
    <main className="screen instructions">
      <h1>📖 Help &amp; Guide</h1>
      <div className="help-topic-list">
        {TOPICS.map((topic) => {
          const isOpen = openTopic === topic.id;
          return (
            <article className="help-topic" key={topic.id}>
              <button
                type="button"
                className="help-topic-button"
                onClick={() => setOpenTopic(isOpen ? null : topic.id)}
                aria-expanded={isOpen}
              >
                <span aria-hidden="true">{topic.icon}</span>
                <span className="help-topic-title">{topic.title}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <div className="help-topic-body">{topic.body}</div>}
            </article>
          );
        })}
      </div>
      <button type="button" className="secondary" onClick={onBack}>
        ← Back
      </button>
    </main>
  );
}
