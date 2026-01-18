import { Hono } from 'hono';
import { MessageService } from '../services';
import { successResponse, errorResponse } from '../utils/responses';
import { ApiError } from '../utils/errors';
import type { ApiResponse, Message, CreateMessageRequest } from '@ccd/types';

const messages = new Hono();

// Store message
messages.post('/', async (c) => {
  try {
    const body = await c.req.json<CreateMessageRequest>();
    const message = MessageService.createMessage(body);
    return c.json(successResponse(message), 201);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

// Get message by UUID
messages.get('/:uuid', (c) => {
  try {
    const uuid = c.req.param('uuid');
    const message = MessageService.getMessageByUuid(uuid);
    return c.json(successResponse(message));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

export { messages };
