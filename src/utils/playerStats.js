import { PLAYER_STATS_KEY } from "../constants";

function normalizeName(name) {
  return String(name || "").trim().toLocaleLowerCase();
}

function emptyPlayerStats(name) {
  return {
    name,
    gamesPlayed: 0,
    gamesWon: 0,
    secondPlaceFinishes: 0,
    thirdPlaceFinishes: 0,
    totalPoints: 0,
    totalTurns: 0,
    highestTurn: 0,
    highestGameScore: 0,
    totalFarkles: 0,
    currentWinningStreak: 0,
    longestWinningStreak: 0,
    longestScoringTurnStreak: 0,
    winsWithoutFarkle: 0,
    headToHead: {}
  };
}

export function readPlayerStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAYER_STATS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writePlayerStats(stats) {
  localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
  return stats;
}

export function getGameStats(player) {
  const history = Array.isArray(player.history) ? player.history : [];
  const scoredTurns = history.filter((turn) => turn.type === "score");
  const farkles = history.filter((turn) => turn.type === "farkle").length;
  const highestTurn = scoredTurns.reduce(
    (highest, turn) => Math.max(highest, Number(turn.points) || 0),
    0
  );

  let currentScoringStreak = 0;
  let longestScoringStreak = 0;

  history.forEach((turn) => {
    if (turn.type === "score" && turn.points > 0) {
      currentScoringStreak += 1;
      longestScoringStreak = Math.max(longestScoringStreak, currentScoringStreak);
    } else {
      currentScoringStreak = 0;
    }
  });

  return {
    turns: history.length,
    averageTurn: history.length > 0 ? player.score / history.length : 0,
    highestTurn,
    farkles,
    longestScoringStreak
  };
}

function updateHeadToHead(record, opponentName, result) {
  const key = normalizeName(opponentName);
  const existing = record[key] || {
    opponentName,
    games: 0,
    wins: 0,
    losses: 0,
    ties: 0
  };

  return {
    ...record,
    [key]: {
      ...existing,
      opponentName,
      games: existing.games + 1,
      wins: existing.wins + (result === "win" ? 1 : 0),
      losses: existing.losses + (result === "loss" ? 1 : 0),
      ties: existing.ties + (result === "tie" ? 1 : 0)
    }
  };
}

export function recordCompletedGame(currentStats, players) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return currentStats;

  const winningScore = sorted[0].score;
  const winnerIds = new Set(
    sorted.filter((player) => player.score === winningScore).map((player) => player.id)
  );
  const nextStats = { ...currentStats };

  sorted.forEach((player, index) => {
    const key = normalizeName(player.name);
    const game = getGameStats(player);
    const existing = nextStats[key] || emptyPlayerStats(player.name);
    const won = winnerIds.has(player.id);

    let headToHead = existing.headToHead || {};
    players
      .filter((opponent) => opponent.id !== player.id)
      .forEach((opponent) => {
        const result =
          player.score > opponent.score
            ? "win"
            : player.score < opponent.score
              ? "loss"
              : "tie";
        headToHead = updateHeadToHead(headToHead, opponent.name, result);
      });

    const currentWinningStreak = won ? existing.currentWinningStreak + 1 : 0;

    nextStats[key] = {
      ...existing,
      name: player.name,
      gamesPlayed: existing.gamesPlayed + 1,
      gamesWon: existing.gamesWon + (won ? 1 : 0),
      secondPlaceFinishes:
        existing.secondPlaceFinishes + (!won && index === 1 ? 1 : 0),
      thirdPlaceFinishes:
        existing.thirdPlaceFinishes + (!won && index === 2 ? 1 : 0),
      totalPoints: existing.totalPoints + player.score,
      totalTurns: existing.totalTurns + game.turns,
      highestTurn: Math.max(existing.highestTurn, game.highestTurn),
      highestGameScore: Math.max(existing.highestGameScore, player.score),
      totalFarkles: existing.totalFarkles + game.farkles,
      currentWinningStreak,
      longestWinningStreak: Math.max(
        existing.longestWinningStreak,
        currentWinningStreak
      ),
      longestScoringTurnStreak: Math.max(
        existing.longestScoringTurnStreak,
        game.longestScoringStreak
      ),
      winsWithoutFarkle:
        existing.winsWithoutFarkle + (won && game.farkles === 0 ? 1 : 0),
      headToHead
    };
  });

  return writePlayerStats(nextStats);
}

export function getAchievements(stats) {
  if (!stats) return [];

  const achievements = [];
  const add = (unlocked, icon, name, description) => {
    achievements.push({ unlocked, icon, name, description });
  };

  add(stats.gamesWon >= 1, "🏆", "First Victory", "Win your first game.");
  add(stats.gamesWon >= 10, "⭐", "10 Wins", "Win 10 games.");
  add(stats.gamesWon >= 25, "⭐", "25 Wins", "Win 25 games.");
  add(stats.gamesWon >= 50, "⭐", "50 Wins", "Win 50 games.");
  add(stats.gamesWon >= 100, "👑", "100 Wins", "Win 100 games.");
  add(
    stats.highestGameScore >= 10000,
    "💯",
    "Ten Thousand Club",
    "Finish a game with at least 10,000 points."
  );
  add(
    stats.highestTurn >= 2000,
    "🔥",
    "2,000-Point Turn",
    "Score at least 2,000 points in one turn."
  );
  add(
    stats.winsWithoutFarkle >= 1,
    "🎯",
    "Clean Win",
    "Win a game without recording a Farkle."
  );
  add(
    stats.longestWinningStreak >= 5,
    "🚀",
    "Five Straight Wins",
    "Win five games in a row."
  );
  add(
    stats.longestScoringTurnStreak >= 5,
    "🎲",
    "Hot Dice",
    "Record five scoring turns in a row."
  );

  return achievements;
}
