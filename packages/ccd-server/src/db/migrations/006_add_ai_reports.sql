-- Add AI reports table for AI-generated insights and reports
CREATE TABLE IF NOT EXISTS ai_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL,         -- 'daily', 'weekly', 'monthly'
  report_date TEXT NOT NULL,         -- YYYY-MM-DD or YYYY-WXX
  content TEXT NOT NULL,             -- Markdown format
  stats_snapshot TEXT,               -- JSON (statistics snapshot)
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_type, report_date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_type ON ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date ON ai_reports(report_date);
