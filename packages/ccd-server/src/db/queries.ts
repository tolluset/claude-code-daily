import { db } from './index';
import { randomUUID } from 'node:crypto';
import { QueryBuilder } from './query-builder';
import type {
  Session,
  Message,
  DailyStats,
  CreateSessionRequest,
  CreateMessageRequest,
  SearchResult,
  SearchOptions
} from '@ccd/types';

// Session queries
export function createSession(data: CreateSessionRequest): Session {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, transcript_path, cwd, project_name, git_branch, source, started_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(id) DO UPDATE SET
      transcript_path = excluded.transcript_path,
      cwd = excluded.cwd,
      project_name = excluded.project_name,
      git_branch = excluded.git_branch,
      source = excluded.source
    RETURNING *
  `);

  return stmt.get(
    data.session_id,
    data.transcript_path,
    data.cwd,
    data.project_name || null,
    data.git_branch || null,
    data.source || 'claude'
  ) as Session;
}

export function getSession(id: string): Session | null {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as Session | null;
}

export function getSessions(options: {
  date?: string;
  from?: string;
  to?: string;
  project?: string;
  limit?: number;
  offset?: number;
  bookmarkedFirst?: boolean;
}): Session[] {
  const { query, params } = QueryBuilder.buildSessionQuery(options);
  const stmt = db.prepare(query);
  return stmt.all(...params) as Session[];
}

export function getTodaySessions(): Session[] {
  const stmt = db.prepare(`
    SELECT * FROM sessions
    WHERE date(started_at) = date('now', 'localtime')
    ORDER BY is_bookmarked DESC, started_at DESC
  `);
  return stmt.all() as Session[];
}

export function endSession(id: string): Session | null {
  const stmt = db.prepare(`
    UPDATE sessions SET ended_at = datetime('now', 'localtime')
    WHERE id = ?
    RETURNING *
  `);
  return stmt.get(id) as Session | null;
}

export function toggleBookmark(id: string, note?: string): Session | null {
  const session = getSession(id);
  if (!session) return null;

  const stmt = db.prepare(`
    UPDATE sessions
    SET is_bookmarked = ?, bookmark_note = ?
    WHERE id = ?
    RETURNING *
  `);

  return stmt.get(
    !session.is_bookmarked,
    note || session.bookmark_note || null,
    id
  ) as Session | null;
}


export function deleteSession(id: string): boolean {
  const session = getSession(id);
  if (!session) return false;

  // Delete messages first, then session
  const deleteMessagesStmt = db.prepare('DELETE FROM messages WHERE session_id = ?');
  const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE id = ?');

  const transaction = db.transaction(() => {
    deleteMessagesStmt.run(id);
    deleteSessionStmt.run(id);
  });

  transaction();
  return true;
}

export function updateSessionSummary(id: string, summary: string): Session | null {
  const stmt = db.prepare(`
    UPDATE sessions
    SET summary = ?
    WHERE id = ? AND summary IS NULL
    RETURNING *
  `);
  return stmt.get(summary, id) as Session | null;
}

// Message queries
export function createMessage(data: CreateMessageRequest): Message {
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, uuid, type, content, model, input_tokens, output_tokens, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(uuid) DO UPDATE SET
      content = excluded.content,
      model = excluded.model,
      input_tokens = excluded.input_tokens,
      output_tokens = excluded.output_tokens
    RETURNING *
  `);

  const result = stmt.get(
    data.session_id,
    data.uuid || randomUUID(),
    data.type,
    data.content || null,
    data.model || null,
    data.input_tokens || null,
    data.output_tokens || null
  ) as Message;

  // Update daily stats
  updateDailyStats(data.input_tokens || 0, data.output_tokens || 0, true);

  return result;
}

export function getMessages(sessionId: string): Message[] {
  const stmt = db.prepare(`
    SELECT * FROM messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `);
  return stmt.all(sessionId) as Message[];
}

export function getMessageByUuid(uuid: string): Message | null {
  const stmt = db.prepare('SELECT * FROM messages WHERE uuid = ?');
  return stmt.get(uuid) as Message | null;
}

// Helper: Get local date string (YYYY-MM-DD)
function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Daily stats queries
export function getTodayStats(): DailyStats {
  const today = getLocalDateString();
  const stmt = db.prepare('SELECT * FROM daily_stats WHERE date = ?');
  const result = stmt.get(today) as DailyStats | null;

  if (!result) {
    return {
      date: today,
      session_count: 0,
      message_count: 0,
      total_input_tokens: 0,
      total_output_tokens: 0
    };
  }

  return result;
}

export function updateDailyStats(
  inputTokens: number,
  outputTokens: number,
  incrementMessage: boolean
): void {
  const today = getLocalDateString();

  // Use prepared statement to prevent SQL injection
  const insertStmt = db.prepare(`
    INSERT INTO daily_stats (date, session_count, message_count, total_input_tokens, total_output_tokens)
    VALUES (?, 0, 0, 0, 0)
    ON CONFLICT(date) DO NOTHING
  `);
  insertStmt.run(today);

  const updateStmt = db.prepare(`
    UPDATE daily_stats SET
      message_count = message_count + ?,
      total_input_tokens = total_input_tokens + ?,
      total_output_tokens = total_output_tokens + ?
    WHERE date = ?
  `);
  updateStmt.run(incrementMessage ? 1 : 0, inputTokens, outputTokens, today);
}

export function incrementSessionCount(): void {
  const today = getLocalDateString();

  // Use prepared statement to prevent SQL injection
  const stmt = db.prepare(`
    INSERT INTO daily_stats (date, session_count, message_count, total_input_tokens, total_output_tokens)
    VALUES (?, 1, 0, 0, 0)
    ON CONFLICT(date) DO UPDATE SET
      session_count = session_count + 1
  `);
  stmt.run(today);
}

export function decrementSessionCount(date?: string): void {
  const targetDate = date || getLocalDateString();

  const stmt = db.prepare(`
    UPDATE daily_stats
    SET session_count = MAX(0, session_count - 1)
    WHERE date = ?
  `);
  stmt.run(targetDate);
}

export function cleanEmptySessions(): { deleted: string[]; sessions: string[] } {
  const findEmptySessionsStmt = db.prepare(`
    SELECT id, date(started_at) as date
    FROM sessions
    WHERE id NOT IN (SELECT DISTINCT session_id FROM messages)
  `);
  
  const emptySessions = findEmptySessionsStmt.all() as { id: string; date: string }[];
  const deleted: string[] = [];
  const dates: string[] = [];

  const deleteSessionStmt = db.prepare('DELETE FROM sessions WHERE id = ?');

  const transaction = db.transaction(() => {
    for (const session of emptySessions) {
      deleteSessionStmt.run(session.id);
      deleted.push(session.id);
      if (!dates.includes(session.date)) {
        dates.push(session.date);
      }
    }
  });

  transaction();

  for (const date of dates) {
    decrementSessionCount(date);
  }

  return { deleted, sessions: dates };
}

export function getDailyStats(options: {
  from?: string;
  to?: string;
  days?: number;
  project?: string;
}): DailyStats[] {
  const { query, params } = QueryBuilder.buildDailyStatsQuery(options);
  const stmt = db.prepare(query);
  return stmt.all(...params) as DailyStats[];
}

// Bulk message insert from transcript
export function bulkInsertMessages(messages: CreateMessageRequest[]): number {
  // Get count before insert
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?');
  const sessionId = messages[0]?.session_id;
  if (!sessionId) return 0;

  const beforeCount = (countStmt.get(sessionId) as { count: number })?.count || 0;

  const stmt = db.prepare(`
    INSERT INTO messages (session_id, uuid, type, content, model, input_tokens, output_tokens, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(uuid) DO NOTHING
  `);

  const transaction = db.transaction(() => {
    for (const msg of messages) {
      stmt.run(
        msg.session_id,
        msg.uuid || null,
        msg.type,
        msg.content || null,
        msg.model || null,
        msg.input_tokens || null,
        msg.output_tokens || null
      );
    }
  });

  transaction();

  // Get count after insert
  const afterCount = (countStmt.get(sessionId) as { count: number })?.count || 0;
  return afterCount - beforeCount;
}

export function searchSessions(options: SearchOptions): SearchResult[] {
  const filters: string[] = [];
  const params: (string | number)[] = [options.query, options.query];

  if (options.from) {
    filters.push('date(s.started_at) >= ?');
    params.push(options.from);
  }

  if (options.to) {
    filters.push('date(s.started_at) <= ?');
    params.push(options.to);
  }

  if (options.project) {
    filters.push('s.project_name = ?');
    params.push(options.project);
  }

  if (options.bookmarkedOnly) {
    filters.push('s.is_bookmarked = 1');
  }

  const filterClause = filters.length > 0 ? ' AND ' + filters.join(' AND ') : '';

  const query = `
    WITH message_results AS (
      SELECT
        m.id as message_id,
        m.session_id,
        m.content,
        m.type,
        messages_fts.rank as score,
        m.timestamp,
        snippet(messages_fts, 0, '<mark>', '</mark>', '...', 30) as snippet,
        'message' as result_type
      FROM messages_fts
      JOIN messages m ON messages_fts.content = m.content AND messages_fts.session_id = m.session_id
      WHERE messages_fts MATCH ?
    ),
    session_results AS (
      SELECT
        NULL as message_id,
        sessions_fts.id as session_id,
        COALESCE(sessions_fts.summary, sessions_fts.bookmark_note, '') as content,
        NULL as type,
        sessions_fts.rank as score,
        sessions_fts.started_at as timestamp,
        snippet(sessions_fts, 0, '<mark>', '</mark>', '...', 30) as snippet,
        CASE
          WHEN sessions_fts.summary IS NOT NULL THEN 'session_summary'
          WHEN sessions_fts.bookmark_note IS NOT NULL THEN 'bookmark_note'
          ELSE 'unknown'
        END as result_type
      FROM sessions_fts
      JOIN sessions s ON sessions_fts.id = s.id
      WHERE sessions_fts MATCH ?
    )
    SELECT
      mr.session_id,
      mr.message_id,
      mr.content,
      mr.snippet,
      mr.result_type as type,
      mr.score,
      mr.timestamp,
      s.project_name,
      s.is_bookmarked
    FROM message_results mr
    JOIN sessions s ON mr.session_id = s.id${filterClause}

    UNION ALL

    SELECT
      sr.session_id,
      sr.message_id,
      sr.content,
      sr.snippet,
      sr.result_type as type,
      sr.score,
      sr.timestamp,
      s.project_name,
      s.is_bookmarked
    FROM session_results sr
    JOIN sessions s ON sr.session_id = s.id${filterClause}
  LIMIT ?
  `;

  params.push((options.limit || 20) * 2);

  const results = db.prepare(query).all(...params) as SearchResult[];

    return results.sort((a, b) => {
    const scoreA = (a.score * 0.7) + (a.is_bookmarked ? 0 : 1 * 0.2);
    const scoreB = (b.score * 0.7) + (b.is_bookmarked ? 0 : 1 * 0.2);
    return scoreA - scoreB;
  }).slice(options.offset || 0, (options.offset || 0) + (options.limit || 20));
}
