import { Hono } from 'hono';
import {
  createSession,
  getSession,
  getSessions,
  getTodaySessions,
  endSession,
  toggleBookmark,
  deleteSession,
  getMessages,
  incrementSessionCount
} from '../db/queries';
import { validateRequired } from '../utils/validation';
import { parseIntParam, parseBoolParam } from '../utils/params';
import type {
  ApiResponse,
  Session,
  SessionListResponse,
  CreateSessionRequest,
  BookmarkRequest,
  Message
} from './types';

const sessions = new Hono();

// List sessions
sessions.get('/', (c) => {
  const date = c.req.query('date');
  const limit = parseIntParam(c.req.query('limit'));
  const offset = parseIntParam(c.req.query('offset'));
  const today = parseBoolParam(c.req.query('today'));

  let sessionList: Session[];

  if (today) {
    sessionList = getTodaySessions();
  } else {
    sessionList = getSessions({
      date: date || undefined,
      limit,
      offset,
      bookmarkedFirst: true
    });
  }

  const response: ApiResponse<SessionListResponse> = {
    success: true,
    data: {
      sessions: sessionList,
      total: sessionList.length
    }
  };

  return c.json(response);
});

// Create session
sessions.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateSessionRequest>();

    const validation = validateRequired(body, ['session_id', 'transcript_path', 'cwd']);
    if (!validation.valid) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: `Missing required fields: ${validation.missing.join(', ')}`
      }, 400);
    }

    const session = createSession(body);
    incrementSessionCount();

    return c.json<ApiResponse<Session>>({
      success: true,
      data: session
    }, 201);
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get session details
sessions.get('/:id', (c) => {
  const id = c.req.param('id');
  const session = getSession(id);

  if (!session) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: 'Session not found'
    }, 404);
  }

  return c.json<ApiResponse<Session>>({
    success: true,
    data: session
  });
});

// End session
sessions.post('/:id/end', (c) => {
  const id = c.req.param('id');
  const session = endSession(id);

  if (!session) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: 'Session not found'
    }, 404);
  }

  return c.json<ApiResponse<Session>>({
    success: true,
    data: session
  });
});

// Toggle bookmark
sessions.post('/:id/bookmark', async (c) => {
  const id = c.req.param('id');
  let note: string | undefined;

  try {
    const body = await c.req.json<BookmarkRequest>();
    note = body.note;
  } catch {
    // Body is optional
  }

  const session = toggleBookmark(id, note);

  if (!session) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: 'Session not found'
    }, 404);
  }

  return c.json<ApiResponse<Session>>({
    success: true,
    data: session
  });
});

// Delete session
sessions.delete('/:id', (c) => {
  const id = c.req.param('id');
  const deleted = deleteSession(id);

  if (!deleted) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: 'Session not found'
    }, 404);
  }

  return c.json<ApiResponse<{ deleted: boolean }>>({
    success: true,
    data: { deleted: true }
  });
});

// List messages for a session
sessions.get('/:id/messages', (c) => {
  const id = c.req.param('id');
  const session = getSession(id);

  if (!session) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: 'Session not found'
    }, 404);
  }

  const messageList = getMessages(id);

  return c.json<ApiResponse<Message[]>>({
    success: true,
    data: messageList
  });
});

export { sessions };
