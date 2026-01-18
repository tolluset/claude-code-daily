import { db } from './index';

export interface Migration {
  name: string;
  up: string;
  down?: string;
}

const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    up: `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        transcript_path TEXT NOT NULL,
        cwd TEXT NOT NULL,
        project_name TEXT,
        git_branch TEXT,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        is_bookmarked BOOLEAN DEFAULT FALSE,
        bookmark_note TEXT,
        summary TEXT
      );

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

      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        session_count INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        total_input_tokens INTEGER DEFAULT 0,
        total_output_tokens INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_is_bookmarked ON sessions(is_bookmarked);
    `
  },
  {
    name: '002_add_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    name: '003_add_fts_search',
    up: `
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        session_id UNINDEXED,
        type UNINDEXED,
        timestamp UNINDEXED,
        tokenize='porter unicode61'
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
        summary,
        bookmark_note,
        id UNINDEXED,
        project_name UNINDEXED,
        started_at UNINDEXED,
        tokenize='porter unicode61'
      );

      CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
        INSERT INTO messages_fts(rowid, content, session_id, type, timestamp)
        VALUES (new.id, new.content, new.session_id, new.type, new.timestamp);
      END;

      CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
        DELETE FROM messages_fts WHERE rowid = old.id;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
        UPDATE messages_fts SET content = new.content
        WHERE rowid = old.id;
      END;

      CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
        INSERT INTO sessions_fts(rowid, summary, bookmark_note, id, project_name, started_at)
        VALUES (new.rowid, new.summary, new.bookmark_note, new.id, new.project_name, new.started_at);
      END;

      CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
        UPDATE sessions_fts 
        SET summary = new.summary, bookmark_note = new.bookmark_note
        WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS sessions_ad AFTER DELETE ON sessions BEGIN
        DELETE FROM sessions_fts WHERE rowid = old.rowid;
      END;

      INSERT INTO messages_fts(rowid, content, session_id, type, timestamp)
      SELECT id, content, session_id, type, timestamp FROM messages;

      INSERT INTO sessions_fts(rowid, summary, bookmark_note, id, project_name, started_at)
      SELECT rowid, summary, bookmark_note, id, project_name, started_at FROM sessions;
    `,
    down: `
      DROP TRIGGER IF EXISTS messages_ai;
      DROP TRIGGER IF EXISTS messages_ad;
      DROP TRIGGER IF EXISTS messages_au;
      DROP TRIGGER IF EXISTS sessions_ai;
      DROP TRIGGER IF EXISTS sessions_au;
      DROP TRIGGER IF EXISTS sessions_ad;
      DROP TABLE IF EXISTS messages_fts;
      DROP TABLE IF EXISTS sessions_fts;
    `
  },
  {
    name: '004_add_source_column',
    up: `
      ALTER TABLE sessions ADD COLUMN source TEXT DEFAULT 'claude';
    `,
    down: `
      ALTER TABLE sessions DROP COLUMN source;
    `
  }
];

export function getAppliedMigrations(): string[] {
  try {
    const stmt = db.prepare('SELECT name FROM migrations ORDER BY applied_at ASC');
    const rows = stmt.all() as { name: string }[];
    return rows.map(row => row.name);
  } catch (e) {
    const error = e as Error;
    if (error.message?.includes('no such table: migrations')) {
      return [];
    }
    throw e;
  }
}

export function applyMigration(migration: Migration): void {
  const transaction = db.transaction(() => {
    db.exec(migration.up);
    const stmt = db.prepare('INSERT INTO migrations (name) VALUES (?)');
    stmt.run(migration.name);
  });
  transaction();
}

export function rollbackMigration(migration: Migration): void {
  if (!migration.down) {
    throw new Error(`Migration ${migration.name} does not have a rollback`);
  }

  const transaction = db.transaction(() => {
    db.exec(migration.down);
    const stmt = db.prepare('DELETE FROM migrations WHERE name = ?');
    stmt.run(migration.name);
  });
  transaction();
}

export function runMigrations(): void {
  const applied = getAppliedMigrations();
  const pending = migrations.filter(m => !applied.includes(m.name));

  if (pending.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Running ${pending.length} migration(s)...`);

  for (const migration of pending) {
    console.log(`Applying migration: ${migration.name}`);
    applyMigration(migration);
  }

  console.log('Migrations completed');
}

export function getMigrationStatus(): { applied: string[]; pending: string[] } {
  const applied = getAppliedMigrations();
  const pending = migrations.filter(m => !applied.includes(m.name)).map(m => m.name);
  return { applied, pending };
}
