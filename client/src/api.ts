import type { GameState, Ruleset } from "@farkle/engine";

export interface ApiPlayer {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface ApiRuleset {
  id: number;
  name: string;
  createdAt: string;
  config: Ruleset;
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

export interface PlayerStats {
  playerId: number;
  name: string;
  gamesPlayed: number;
  wins: number;
  totalBanked: number;
  turns: number;
  farkles: number;
  bestTurn: number;
  bestGame: number;
  threeFarklePenalties: number;
  hotDiceTurns: number;
}

export interface GameSummary {
  id: number;
  startedAt: string;
  endedAt: string;
  winnerId: number | null;
  players: Array<{ playerId: number; name: string; finalScore: number }>;
}

export interface GameDetailTurn {
  turnNumber: number;
  playerId: number;
  banked: number;
  farkled: boolean;
  penalty: number;
  events: Array<{ comboKey: string; points: number; diceUsed: number }>;
}

export interface GameDetail {
  id: number;
  startedAt: string;
  endedAt: string;
  winnerId: number | null;
  ruleset: Ruleset;
  players: Array<{ playerId: number; seatOrder: number; finalScore: number; name: string }>;
  turns: GameDetailTurn[];
}

export function fetchStats(): Promise<PlayerStats[]> {
  return request("/api/stats");
}

export function fetchGames(): Promise<GameSummary[]> {
  return request("/api/games");
}

export function fetchGameDetail(id: number): Promise<GameDetail> {
  return request(`/api/games/${id}`);
}

export function fetchRulesets(): Promise<ApiRuleset[]> {
  return request("/api/rulesets");
}

async function rulesetRequest(path: string, method: string, config: Ruleset): Promise<ApiRuleset> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { errors?: string[] } | null;
    throw new Error(body?.errors?.join(". ") ?? `Save failed (${res.status})`);
  }
  return res.json() as Promise<ApiRuleset>;
}

export function createRuleset(config: Ruleset): Promise<ApiRuleset> {
  return rulesetRequest("/api/rulesets", "POST", config);
}

export function updateRuleset(id: number, config: Ruleset): Promise<ApiRuleset> {
  return rulesetRequest(`/api/rulesets/${id}`, "PUT", config);
}

export function deleteRuleset(id: number): Promise<void> {
  return request(`/api/rulesets/${id}`, { method: "DELETE" });
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
