import type { GameState } from "@farkle/engine";

export interface ApiPlayer {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchPlayers(): Promise<ApiPlayer[]> {
  return request("/api/players");
}

export function createPlayer(name: string): Promise<ApiPlayer> {
  return request("/api/players", { method: "POST", body: JSON.stringify({ name }) });
}

export function deletePlayer(id: number): Promise<void> {
  return request(`/api/players/${id}`, { method: "DELETE" });
}

/** Persist a finished game. Engine player ids are stringified server ids. */
export function saveGame(game: GameState, startedAt: string): Promise<unknown> {
  return request("/api/games", {
    method: "POST",
    body: JSON.stringify({
      startedAt,
      endedAt: new Date().toISOString(),
      ruleset: game.ruleset,
      winnerId: game.winnerId == null ? null : Number(game.winnerId),
      players: game.players.map((p, seatOrder) => ({
        playerId: Number(p.id),
        seatOrder,
        finalScore: p.score
      })),
      turns: game.history.map((t) => ({ ...t, playerId: Number(t.playerId) }))
    })
  });
}
