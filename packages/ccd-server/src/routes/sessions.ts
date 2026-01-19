import { Hono } from 'hono';
import { SessionService } from '../services';
import { parseIntParam, parseBoolParam } from '../utils/query-parsers';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responses';
import { ApiError } from '../utils/errors';
import type {
  ApiResponse,
  Session,
  SessionListResponse,
  CreateSessionRequest,
  BookmarkRequest,
  Message
} from '@ccd/types';

const sessions = new Hono();

// List sessions
sessions.get('/', (c) => {
  const date = c.req.query('date');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const project = c.req.query('project');
  const limit = parseIntParam(c.req.query('limit'));
  const offset = parseIntParam(c.req.query('offset'));
  const today = parseBoolParam(c.req.query('today'));
  const bookmarkedOnly = parseBoolParam(c.req.query('bookmarkedOnly'));
  const bookmarkedFirst = parseBoolParam(c.req.query('bookmarkedFirst')) ?? true;

  const sessionList = SessionService.getSessions({
    date: date || undefined,
    from: from || undefined,
    to: to || undefined,
    project: project || undefined,
    limit,
    offset,
    bookmarkedFirst,
    bookmarkedOnly,
    today
  });

  return c.json(successResponse({
    sessions: sessionList,
    total: sessionList.length
  }));
});

// Create session
sessions.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateSessionRequest>();
    const session = SessionService.createSession(body);
    return c.json(successResponse(session), 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// Get session details
sessions.get('/:id', (c) => {
  try {
    const id = c.req.param('id');
    const session = SessionService.getSession(id);
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// End session
sessions.post('/:id/end', (c) => {
  try {
    const id = c.req.param('id');
    const session = SessionService.endSession(id);
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// Update session summary
sessions.post('/:id/summary', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ summary?: string }>();
    const session = SessionService.updateSessionSummary(id, body.summary || '');
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// Toggle bookmark
sessions.post('/:id/bookmark', async (c) => {
  try {
    const id = c.req.param('id');
    let note: string | undefined;

    try {
      const body = await c.req.json<BookmarkRequest>();
      note = body.note;
    } catch {
      // Body is optional
    }

    const session = SessionService.toggleBookmark(id, note);
    return c.json(successResponse(session));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// Delete session
sessions.delete('/:id', (c) => {
  try {
    const id = c.req.param('id');
    SessionService.deleteSession(id);
    return c.json(successResponse({ deleted: true }));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// Clean empty sessions
sessions.post('/clean-empty', (c) => {
  try {
    const result = SessionService.cleanEmptySessions();
    return c.json(successResponse({
      deleted: result.deleted,
      count: result.deleted.length,
      affectedDates: result.sessions
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// List messages for a session
sessions.get('/:id/messages', (c) => {
  try {
    const id = c.req.param('id');
    const messageList = SessionService.getSessionMessages(id);
    return c.json(successResponse(messageList));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

export { sessions };