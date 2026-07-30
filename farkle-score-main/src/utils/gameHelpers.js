export function getPlayerName(player, index) {
  return player?.name?.trim() || `Player ${index + 1}`;
}

export function getLeader(players) {
  return [...players].sort((a, b) => b.score - a.score)[0];
}

export function getTurnScore(actions) {
  return actions.reduce((total, action) => total + action.points, 0);
}

export function getOrderedPlayers(turnOrder, players) {
  return turnOrder
    .map((id) => players.find((player) => player.id === id))
    .filter(Boolean);
}

export function getFinalRoundPlayerIds(players, startingIndex) {
  if (players.length <= 1) return [];

  const ids = [];

  for (let offset = 1; offset < players.length; offset += 1) {
    const nextIndex = (startingIndex + offset) % players.length;
    ids.push(players[nextIndex].id);
  }

  return ids;
}
