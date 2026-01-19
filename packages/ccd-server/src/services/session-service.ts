import {
  createSession,
  getSession,
  getSessions,
  getTodaySessions,
  endSession,
  toggleBookmark,
  deleteSession,
  getMessages,
  incrementSessionCount,
  updateSessionSummary,
  cleanEmptySessions
} from '../db/queries';
import { validateRequired, validateStringEnum, validateDateString, validateDateRange, validatePositiveInteger, Errors } from '../utils/errors';
import type {
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  Message
} from '@ccd/types';

/**
 * Service layer for session-related business logic
 */
export class SessionService {
  /**
   * Get sessions with filtering and pagination
   */
  static getSessions(options: {
    date?: string;
    from?: string;
    to?: string;
    project?: string;
    limit?: number;
    offset?: number;
    bookmarkedFirst?: boolean;
    bookmarkedOnly?: boolean;
    today?: boolean;
  }): Session[] {
    if (options.today) {
      return getTodaySessions();
    }

    return getSessions({
      date: options.date,
      from: options.from,
      to: options.to,
      project: options.project,
      limit: options.limit,
      offset: options.offset,
      bookmarkedFirst: options.bookmarkedFirst,
      bookmarkedOnly: options.bookmarkedOnly
    });
  }

  /**
   * Create a new session
   */
  static createSession(data: CreateSessionRequest): Session {
    // Manual validation since CreateSessionRequest doesn't extend Record<string, unknown>
    if (!data.session_id || !data.transcript_path || !data.cwd) {
      throw Errors.ValidationError(['session_id', 'transcript_path', 'cwd']);
    }

    if (data.source) {
      validateStringEnum(data.source, ['claude', 'opencode'], 'source');
    }

    const session = createSession(data);
    incrementSessionCount();
    return session;
  }

  /**
   * Get a single session by ID
   */
  static getSession(id: string): Session {
    const session = getSession(id);
    if (!session) {
      throw Errors.NotFound('Session');
    }
    return session;
  }

  /**
   * End a session
   */
  static endSession(id: string): Session {
    const session = endSession(id);
    if (!session) {
      throw Errors.NotFound('Session');
    }
    return session;
  }

  /**
   * Toggle bookmark on a session
   */
  static toggleBookmark(id: string, note?: string): Session {
    const session = toggleBookmark(id, note);
    if (!session) {
      throw Errors.NotFound('Session');
    }
    return session;
  }

  /**
   * Delete a session
   */
  static deleteSession(id: string): boolean {
    const session = getSession(id);
    if (!session) {
      throw Errors.NotFound('Session');
    }

    return deleteSession(id);
  }

  /**
   * Update session summary
   */
  static updateSessionSummary(id: string, summary: string): Session {
    const session = updateSessionSummary(id, summary);
    if (!session) {
      throw Errors.NotFound('Session');
    }
    return session;
  }

  /**
   * Get messages for a session
   */
  static getSessionMessages(id: string): Message[] {
    // Verify session exists
    SessionService.getSession(id);
    return getMessages(id);
  }

  /**
   * Clean empty sessions (sessions without messages)
   */
  static cleanEmptySessions(): { deleted: string[]; sessions: string[] } {
    return cleanEmptySessions();
  }
}