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

// Phase 0 bootstrap; replaced by drizzle-kit migrations in Phase 1.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export const db = drizzle(sqlite, { schema });
