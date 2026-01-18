import { Hono } from 'hono';
import { createMessage, getMessageByUuid } from '../db/queries';
import { validateRequired } from '../utils/validation';
import type { ApiResponse, Message, CreateMessageRequest } from '@ccd/types';

const messages = new Hono();

// Store message
messages.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateMessageRequest>();

    const validation = validateRequired(body, ['session_id', 'type']);
    if (!validation.valid) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: `Missing required fields: ${validation.missing.join(', ')}`
      }, 400);
    }

    if (body.type !== 'user' && body.type !== 'assistant') {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'type must be "user" or "assistant"'
      }, 400);
    }

    const message = createMessage(body);

    return c.json<ApiResponse<Message>>({
      success: true,
      data: message
    }, 201);
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get message by UUID
messages.get('/:uuid', (c) => {
  const uuid = c.req.param('uuid');
  const message = getMessageByUuid(uuid);

  if (!message) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: 'Message not found'
    }, 404);
  }

  return c.json<ApiResponse<Message>>({
    success: true,
    data: message
  });
});

export { messages };
