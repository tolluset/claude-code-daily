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
  },
  {
    name: '006_add_cost_tracking',
    up: `
      -- Model pricing table for cost calculation
      CREATE TABLE IF NOT EXISTS model_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_family TEXT NOT NULL UNIQUE,
        input_cost_per_mtok REAL NOT NULL,
        output_cost_per_mtok REAL NOT NULL,
        effective_date TEXT NOT NULL,
        notes TEXT
      );

      -- Current Claude pricing (2026-01 baseline)
      INSERT INTO model_pricing (model_family, input_cost_per_mtok, output_cost_per_mtok, effective_date, notes) VALUES
        ('opus-4-5', 15.00, 75.00, '2026-01-01', 'Claude Opus 4.5'),
        ('sonnet-4-5', 3.00, 15.00, '2026-01-01', 'Claude Sonnet 4.5'),
        ('haiku-3-5', 0.80, 4.00, '2026-01-01', 'Claude Haiku 3.5');

      -- Add cost columns to messages table
      ALTER TABLE messages ADD COLUMN input_cost REAL;
      ALTER TABLE messages ADD COLUMN output_cost REAL;
      ALTER TABLE messages ADD COLUMN is_estimated_cost BOOLEAN DEFAULT FALSE;

      -- Add cost columns to daily_stats table
      ALTER TABLE daily_stats ADD COLUMN total_input_cost REAL DEFAULT 0;
      ALTER TABLE daily_stats ADD COLUMN total_output_cost REAL DEFAULT 0;

      -- Index for pricing lookups
      CREATE INDEX IF NOT EXISTS idx_pricing_family ON model_pricing(model_family);

      -- Backfill existing message costs
      UPDATE messages
      SET
        input_cost = COALESCE(
          (SELECT (messages.input_tokens / 1000000.0) * mp.input_cost_per_mtok
           FROM model_pricing mp
           WHERE messages.model LIKE '%' || mp.model_family || '%'
           LIMIT 1),
          0
        ),
        output_cost = COALESCE(
          (SELECT (messages.output_tokens / 1000000.0) * mp.output_cost_per_mtok
           FROM model_pricing mp
           WHERE messages.model LIKE '%' || mp.model_family || '%'
           LIMIT 1),
          0
        ),
        is_estimated_cost = TRUE
      WHERE input_tokens IS NOT NULL OR output_tokens IS NOT NULL;

      -- Backfill daily_stats costs
      UPDATE daily_stats
      SET
        total_input_cost = (
          SELECT COALESCE(SUM(m.input_cost), 0)
          FROM messages m
          JOIN sessions s ON m.session_id = s.id
          WHERE date(s.started_at) = daily_stats.date
        ),
        total_output_cost = (
          SELECT COALESCE(SUM(m.output_cost), 0)
          FROM messages m
          JOIN sessions s ON m.session_id = s.id
          WHERE date(s.started_at) = daily_stats.date
        );
    `,
    down: `
      ALTER TABLE messages DROP COLUMN input_cost;
      ALTER TABLE messages DROP COLUMN output_cost;
      ALTER TABLE messages DROP COLUMN is_estimated_cost;
      ALTER TABLE daily_stats DROP COLUMN total_input_cost;
      ALTER TABLE daily_stats DROP COLUMN total_output_cost;
      DROP TABLE IF EXISTS model_pricing;
    `
  },
  {
    name: '005_add_insights',
    up: `
      -- Add session insights table
      CREATE TABLE IF NOT EXISTS session_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
        summary TEXT,
        key_learnings TEXT,      -- JSON array of strings
        problems_solved TEXT,     -- JSON array of strings
        code_patterns TEXT,       -- JSON array of strings
        technologies TEXT,        -- JSON array of strings
        difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_notes TEXT
      );

      -- Index for faster lookups
      CREATE INDEX IF NOT EXISTS idx_insights_session ON session_insights(session_id);

      -- FTS for insights search
      CREATE VIRTUAL TABLE IF NOT EXISTS insights_fts USING fts5(
        summary,
        key_learnings,
        problems_solved,
        code_patterns,
        user_notes,
        insight_id UNINDEXED,
        session_id UNINDEXED,
        tokenize='porter unicode61'
      );

      -- Trigger to sync with FTS
      CREATE TRIGGER IF NOT EXISTS insights_ai AFTER INSERT ON session_insights BEGIN
        INSERT INTO insights_fts(rowid, summary, key_learnings, problems_solved, code_patterns, user_notes, insight_id, session_id)
        VALUES (new.id, new.summary, new.key_learnings, new.problems_solved, new.code_patterns, new.user_notes, new.id, new.session_id);
      END;

      CREATE TRIGGER IF NOT EXISTS insights_au AFTER UPDATE ON session_insights BEGIN
        UPDATE insights_fts
        SET summary = new.summary,
            key_learnings = new.key_learnings,
            problems_solved = new.problems_solved,
            code_patterns = new.code_patterns,
            user_notes = new.user_notes
        WHERE rowid = new.id;
      END;

      CREATE TRIGGER IF NOT EXISTS insights_ad AFTER DELETE ON session_insights BEGIN
        DELETE FROM insights_fts WHERE rowid = old.id;
      END;
    `,
    down: `
      DROP TRIGGER IF EXISTS insights_ad;
      DROP TRIGGER IF EXISTS insights_au;
      DROP TRIGGER IF EXISTS insights_ai;
      DROP TABLE IF EXISTS insights_fts;
      DROP TABLE IF EXISTS session_insights;
    `
  },
  {
    name: '007_add_ai_reports',
    up: `
      CREATE TABLE IF NOT EXISTS ai_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_type TEXT NOT NULL,
        report_date TEXT NOT NULL,
        content TEXT NOT NULL,
        stats_snapshot TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_type, report_date)
      );

      CREATE INDEX IF NOT EXISTS idx_reports_type ON ai_reports(report_type);
      CREATE INDEX IF NOT EXISTS idx_reports_date ON ai_reports(report_date);
    `,
    down: `
      DROP TABLE IF EXISTS ai_reports;
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
