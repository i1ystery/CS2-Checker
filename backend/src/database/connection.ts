import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

let db: Database.Database | null = null;

export function connectDatabase(): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'cs2checker.db');
    db = new Database(dbPath);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE IF NOT EXISTS demo_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id TEXT NOT NULL UNIQUE,
        map_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS player_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        demo_match_id INTEGER NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('kill', 'death')),
        x REAL NOT NULL,
        y REAL NOT NULL,
        team_num INTEGER,
        layer TEXT CHECK(layer IN ('upper', 'lower', NULL)),
        FOREIGN KEY (demo_match_id) REFERENCES demo_matches(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_demo_matches_match_id ON demo_matches(match_id);
      CREATE INDEX IF NOT EXISTS idx_demo_matches_map_name ON demo_matches(map_name);
      CREATE INDEX IF NOT EXISTS idx_player_events_demo_match_id ON player_events(demo_match_id);
      CREATE INDEX IF NOT EXISTS idx_player_events_player_id ON player_events(player_id);
      CREATE INDEX IF NOT EXISTS idx_player_events_composite ON player_events(player_id, demo_match_id);
    `);

    console.log('Connected to SQLite database');
  } catch (error) {
    db = null;
    console.warn('Failed to connect to SQLite database:', error instanceof Error ? error.message : error);
    console.warn('Application will run without database. Demo data will not be persisted.');
  }
}

export function getDb(): Database.Database | null {
  return db;
}

export function isDatabaseConnected(): boolean {
  return db !== null && db.open;
}

export function disconnectDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Disconnected from SQLite database');
  }
}
