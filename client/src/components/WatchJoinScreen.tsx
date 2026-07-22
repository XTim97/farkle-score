import { useState } from "react";

interface Props {
  onBack: () => void;
  onJoin: (code: string) => void;
}

export default function WatchJoinScreen({ onBack, onJoin }: Props) {
  const [code, setCode] = useState("");
  const cleaned = code.trim().toUpperCase();

  return (
    <main className="screen">
      <h1>📺 Watch a Game</h1>
      <p className="hint">
        Ask the scorer to tap the 📺 Live badge on their game screen; enter the code shown, or
        scan their QR code.
      </p>
      <form
        className="add-player"
        onSubmit={(e) => {
          e.preventDefault();
          if (cleaned.length >= 4) onJoin(cleaned);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Game code, e.g. K7MPQ2"
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="Game code"
        />
        <button type="submit" className="primary" disabled={cleaned.length < 4}>
          Watch
        </button>
      </form>
      <div className="stack">
        <button type="button" className="secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </main>
  );
}
