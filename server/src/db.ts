import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema.js";

const dataDir = process.env.FARKLE_DATA_DIR ?? path.resolve(import.meta.dirname, "../../data");
mkdirSync(dataDir, { recursive: true });

export const sqlite = new Database(path.join(dataDir, "farkle.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Bootstrap DDL; to be replaced by drizzle-kit migrations when the schema
// starts changing shape rather than just growing.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    club TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS rulesets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    config_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    club TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    winner_id INTEGER REFERENCES players(id),
    ruleset_json TEXT NOT NULL,
    club TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS game_players (
    game_id INTEGER NOT NULL REFERENCES games(id),
    player_id INTEGER NOT NULL REFERENCES players(id),
    seat_order INTEGER NOT NULL,
    final_score INTEGER NOT NULL,
    PRIMARY KEY (game_id, player_id)
  );

  CREATE TABLE IF NOT EXISTS turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id),
    player_id INTEGER NOT NULL REFERENCES players(id),
    turn_number INTEGER NOT NULL,
    banked INTEGER NOT NULL,
    farkled INTEGER NOT NULL,
    penalty INTEGER NOT NULL DEFAULT 0,
    rolls_json TEXT
  );

  CREATE TABLE IF NOT EXISTS scoring_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turn_id INTEGER NOT NULL REFERENCES turns(id),
    combo_key TEXT NOT NULL,
    points INTEGER NOT NULL,
    dice_used INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    roll_index INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_turns_game ON turns(game_id);
  CREATE INDEX IF NOT EXISTS idx_events_turn ON scoring_events(turn_id);
`);

// Additive migrations for databases created before roll tracking. NULL in
// these columns marks legacy turns whose roll boundaries are unknown.
function ensureColumn(table: string, column: string, ddl: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}
ensureColumn("turns", "rolls_json", "rolls_json TEXT");
ensureColumn("scoring_events", "roll_index", "roll_index INTEGER");

// Club scoping (anonymous per-browser households). Legacy players/rulesets
// tables carry a global UNIQUE(name) that must become per-club, which SQLite
// can only do via table rebuild. Legacy rows keep club='' and are visible to
// no one, matching "when in doubt, blank".
function rebuildForClubs(table: "players" | "rulesets", newDdl: string, copyCols: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (cols.some((c) => c.name === "club")) return;
  sqlite.pragma("foreign_keys = OFF");
  sqlite.exec(`
    BEGIN;
    CREATE TABLE ${table}_new (${newDdl});
    INSERT INTO ${table}_new (${copyCols}) SELECT ${copyCols} FROM ${table};
    DROP TABLE ${table};
    ALTER TABLE ${table}_new RENAME TO ${table};
    COMMIT;
  `);
  sqlite.pragma("foreign_keys = ON");
}
rebuildForClubs(
  "players",
  `id INTEGER PRIMARY KEY AUTOINCREMENT,
   name TEXT NOT NULL,
   color TEXT,
   created_at TEXT NOT NULL DEFAULT (datetime('now')),
   club TEXT NOT NULL DEFAULT ''`,
  "id, name, color, created_at"
);
rebuildForClubs(
  "rulesets",
  `id INTEGER PRIMARY KEY AUTOINCREMENT,
   name TEXT NOT NULL,
   config_json TEXT NOT NULL,
   created_at TEXT NOT NULL DEFAULT (datetime('now')),
   club TEXT NOT NULL DEFAULT ''`,
  "id, name, config_json, created_at"
);
ensureColumn("games", "club", "club TEXT NOT NULL DEFAULT ''");
sqlite.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_players_club_name ON players(club, name);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_rulesets_club_name ON rulesets(club, name);
  CREATE INDEX IF NOT EXISTS idx_games_club ON games(club);
`);

export const db = drizzle(sqlite, { schema });
