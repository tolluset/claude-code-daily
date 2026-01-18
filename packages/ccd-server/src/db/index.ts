import { Database } from 'bun:sqlite';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Data directory: ~/.ccd/
const DATA_DIR = join(process.env.HOME || '~', '.ccd');
const DB_PATH = join(DATA_DIR, 'ccd.db');

// Create data directory if not exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Apply schema inline (avoids file path issues with bundlers)
db.exec(`
  -- Sessions table
  CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      transcript_path TEXT NOT NULL,
      cwd TEXT NOT NULL,
      project_name TEXT,
      git_branch TEXT,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      is_bookmarked BOOLEAN DEFAULT FALSE,
      bookmark_note TEXT
  );

  -- Messages table
  CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      uuid TEXT UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
      content TEXT,
      model TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  -- Daily stats table
  CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      session_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      total_input_tokens INTEGER DEFAULT 0,
      total_output_tokens INTEGER DEFAULT 0
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_is_bookmarked ON sessions(is_bookmarked);
`);

export { db, DATA_DIR, DB_PATH };
