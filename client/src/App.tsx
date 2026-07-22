import { COMBOS } from "@farkle/engine";
import { useEffect, useState } from "react";

interface Health {
  status: string;
  version: string;
  ruleset: string;
  players: number;
}

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json() as Promise<Health>)
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="scaffold">
      <h1>🎲 Farkle Score</h1>
      <p>v2 rewrite scaffold. {COMBOS.length} scoring combos loaded from the engine.</p>
      {health && (
        <p className="health ok">
          API: {health.status} · ruleset "{health.ruleset}" · {health.players} saved players
        </p>
      )}
      {error && <p className="health err">API unreachable: {error}</p>}
    </main>
  );
}
