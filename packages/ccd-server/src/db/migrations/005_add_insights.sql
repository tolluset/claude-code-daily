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
