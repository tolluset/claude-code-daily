import Database from 'bun:sqlite';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { runMigrations } from './migrations';

// Data directory: ~/.ccd/ or /tmp/ccd-test/ for testing
const DATA_DIR = process.env.NODE_ENV === 'test' 
  ? '/tmp/ccd-test' 
  : join(process.env.HOME || '~', '.ccd');
const DB_PATH = join(DATA_DIR, 'ccd.db');

// Create data directory if not exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create migrations table first (required for migration system)
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Run migrations
runMigrations();

export { db, DATA_DIR, DB_PATH };
