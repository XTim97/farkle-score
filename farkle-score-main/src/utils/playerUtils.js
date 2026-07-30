import { SAVED_PLAYERS_KEY } from "../constants";

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function makePlayer(index, name = `Player ${index + 1}`) {
  return {
    id: makeId(),
    name,
    score: 0,
    history: []
  };
}

function isDefaultGeneratedPlayerName(name) {
  return /^Player\s+\d+$/i.test(name.trim());
}

export function readSavedPlayers() {
  try {
    const raw = localStorage.getItem(SAVED_PLAYERS_KEY);
    if (!raw) return [];

    const names = JSON.parse(raw);

    if (!Array.isArray(names)) return [];

    return names.filter(
      (name) =>
        typeof name === "string" &&
        name.trim() &&
        !isDefaultGeneratedPlayerName(name)
    );
  } catch {
    return [];
  }
}

export function writeSavedPlayers(names) {
  const cleanNames = [
    ...new Set(names.map((name) => name.trim()).filter(Boolean))
  ];

  localStorage.setItem(SAVED_PLAYERS_KEY, JSON.stringify(cleanNames));

  return cleanNames;
}
