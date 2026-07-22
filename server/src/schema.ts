import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color"),
  createdAt: text("created_at").notNull()
});

export const rulesets = sqliteTable("rulesets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  configJson: text("config_json").notNull(),
  createdAt: text("created_at").notNull()
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at").notNull(),
  winnerId: integer("winner_id").references(() => players.id),
  /** Frozen ruleset snapshot so stats stay accurate if rules change later. */
  rulesetJson: text("ruleset_json").notNull()
});

export const gamePlayers = sqliteTable("game_players", {
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  seatOrder: integer("seat_order").notNull(),
  finalScore: integer("final_score").notNull()
});

export const turns = sqliteTable("turns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id")
    .notNull()
    .references(() => games.id),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id),
  turnNumber: integer("turn_number").notNull(),
  banked: integer("banked").notNull(),
  farkled: integer("farkled", { mode: "boolean" }).notNull(),
  penalty: integer("penalty").notNull().default(0),
  /** JSON array of dice counts per roll; null on legacy pre-roll-tracking turns. */
  rollsJson: text("rolls_json")
});

export const scoringEvents = sqliteTable("scoring_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  turnId: integer("turn_id")
    .notNull()
    .references(() => turns.id),
  comboKey: text("combo_key").notNull(),
  points: integer("points").notNull(),
  diceUsed: integer("dice_used").notNull(),
  seq: integer("seq").notNull(),
  rollIndex: integer("roll_index")
});
