import { db } from './index';
import type {
  Session,
  Message,
  DailyStats,
  CreateSessionRequest,
  CreateMessageRequest
} from '@ccd/types';

// Session queries
export function createSession(data: CreateSessionRequest): Session {
  const stmt = db.prepare(`
    INSERT INTO sessions (id, transcript_path, cwd, project_name, git_branch, started_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(id) DO UPDATE SET
      transcript_path = excluded.transcript_path,
      cwd = excluded.cwd,
      project_name = excluded.project_name,
      git_branch = excluded.git_branch
    RETURNING *
  `);

  return stmt.get(
    data.session_id,
    data.transcript_path,
    data.cwd,
    data.project_name || null,
    data.git_branch || null
  ) as Session;
}

export function getSession(id: string): Session | null {
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as Session | null;
}

export function getSessions(options: {
  date?: string;
  limit?: number;
  offset?: number;
  bookmarkedFirst?: boolean;
}): Session[] {
  let query = 'SELECT * FROM sessions';
  const params: (string | number)[] = [];

  if (options.date) {
    query += ' WHERE date(started_at) = ?';
    params.push(options.date);
  }

  if (options.bookmarkedFirst) {
    query += ' ORDER BY is_bookmarked DESC, started_at DESC';
  } else {
    query += ' ORDER BY started_at DESC';
  }

  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options.offset) {
    query += ' OFFSET ?';
    params.push(options.offset);
  }

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
    data.uuid || null,
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

// Bulk message insert from transcript
export function bulkInsertMessages(messages: CreateMessageRequest[]): number {
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, uuid, type, content, model, input_tokens, output_tokens, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    ON CONFLICT(uuid) DO NOTHING
  `);

  let inserted = 0;
  const transaction = db.transaction(() => {
    for (const msg of messages) {
      const result = stmt.run(
        msg.session_id,
        msg.uuid || null,
        msg.type,
        msg.content || null,
        msg.model || null,
        msg.input_tokens || null,
        msg.output_tokens || null
      );
      if (result.changes > 0) inserted++;
    }
  });

  transaction();
  return inserted;
}
