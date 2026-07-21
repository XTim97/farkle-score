import { useState } from "react";

const HELP_TOPICS = [
  {
    id: "start",
    icon: "🎲",
    title: "Starting a New Game",
    body: (
      <>
        <p>From the Home screen, tap <strong>New Game</strong>.</p>
        <p>Select at least two saved players, or add new players by entering a name and pressing <strong>Add Player</strong>.</p>
      </>
    )
  },
  {
    id: "players",
    icon: "👥",
    title: "Adding and Selecting Players",
    body: (
      <>
        <p>Saved players appear with checkboxes. Select the people who are playing.</p>
        <p>To add someone new, type the player name, then press <strong>Add Player</strong>. Use the × button to remove a saved name.</p>
      </>
    )
  },
  {
    id: "order",
    icon: "🪑",
    title: "Arranging Table Order",
    body: (
      <>
        <p>Put players in the same order they are seated around the table.</p>
        <p>Tap a player to select them, then tap the position where you want that player moved.</p>
      </>
    )
  },
  {
    id: "starter",
    icon: "🎯",
    title: "Choosing the First Player",
    body: (
      <>
        <p>After the table order is set, tap <strong>Randomize First Player</strong>.</p>
        <p>The app chooses one player to start, while everyone else remains in the same circular table order.</p>
      </>
    )
  },
  {
    id: "scoring",
    icon: "➕",
    title: "Scoring",
    body: (
      <>
        <p><strong>Tap a scoring button for each scoring combination you rolled. You may tap multiple scoring buttons during your turn to build your Turn score. When you have finished scoring your roll, tap <em>End Turn</em> to add your Turn score to your total score. If your roll contains no scoring combinations, tap <em>Farkle</em> to end your turn with zero points. If you make a scoring mistake, tap <em>Undo</em> to remove your most recent scoring selection.</strong></p>
        <h3>Scoring Values</h3>
        <ul className="scoring-help-list">
          <li><span>Single 1</span><strong>100</strong></li>
          <li><span>Single 5</span><strong>50</strong></li>
          <li><span>Three 1s</span><strong>300</strong></li>
          <li><span>Three 2s</span><strong>200</strong></li>
          <li><span>Three 3s</span><strong>300</strong></li>
          <li><span>Three 4s</span><strong>400</strong></li>
          <li><span>Three 5s</span><strong>500</strong></li>
          <li><span>Three 6s</span><strong>600</strong></li>
          <li><span>Full House</span><strong>850</strong></li>
          <li><span>Four of a Kind</span><strong>1,000</strong></li>
          <li><span>Five of a Kind</span><strong>2,000</strong></li>
          <li><span>Six of a Kind</span><strong>3,000</strong></li>
          <li><span>Three Pairs</span><strong>1,500</strong></li>
          <li><span>Four of a Kind + Pair</span><strong>1,500</strong></li>
          <li><span>Two Triplets</span><strong>2,500</strong></li>
          <li><span>Small Straight</span><strong>850</strong></li>
          <li><span>Large Straight</span><strong>1,500</strong></li>
        </ul>
      </>
    )
  },
  {
    id: "undo",
    icon: "↩️",
    title: "Undo",
    body: (
      <p>Press <strong>Undo</strong> to remove the most recent scoring selection before the turn is ended.</p>
    )
  },
  {
    id: "farkle",
    icon: "💥",
    title: "Farkle",
    body: (
      <p>If a roll has no scoring dice, press <strong>Farkle</strong>. The current turn ends and no points from that turn are added.</p>
    )
  },
  {
    id: "final-round",
    icon: "🏁",
    title: "Final Round",
    body: (
      <>
        <p>When a player reaches 10,000 points or more, the Final Round begins.</p>
        <p>Each other player receives one last turn. The player with the highest total score wins.</p>
      </>
    )
  },
  {
    id: "play-again",
    icon: "🏆",
    title: "Winner and Play Again Options",
    body: (
      <>
        <p><strong>Same Players</strong> keeps the same table order and randomly chooses a new first player.</p>
        <p><strong>New Players</strong> returns to player selection. <strong>Home</strong> returns to the opening screen.</p>
      </>
    )
  }
];

export default function InstructionsScreen({ onBack }) {
  const [openTopic, setOpenTopic] = useState("start");

  function toggleTopic(id) {
    setOpenTopic((current) => (current === id ? null : id));
  }

  return (
    <section className="help-center panel">
      <div className="help-center-header">
        <span className="help-book" aria-hidden="true">📖</span>
        <div>
          <h1>Player Instructions</h1>
          <p>Tap a topic to open or close it.</p>
        </div>
      </div>

      <div className="help-topic-list">
        {HELP_TOPICS.map((topic) => {
          const isOpen = openTopic === topic.id;

          return (
            <article className={`help-topic ${isOpen ? "open" : ""}`} key={topic.id}>
              <button
                type="button"
                className="help-topic-button"
                onClick={() => toggleTopic(topic.id)}
                aria-expanded={isOpen}
                aria-controls={`help-topic-${topic.id}`}
              >
                <span className="help-topic-icon" aria-hidden="true">{topic.icon}</span>
                <span className="help-topic-title">{topic.title}</span>
                <span className="help-topic-chevron" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="help-topic-content" id={`help-topic-${topic.id}`}>
                  {topic.body}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button type="button" className="help-back-button secondary" onClick={onBack}>
        ← Back to Home
      </button>
    </section>
  );
}
