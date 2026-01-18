import { Hono } from 'hono';
import { MessageService } from '../services';
import { successResponse } from '../utils/responses';
import type { ApiResponse, Message, CreateMessageRequest } from '@ccd/types';

const messages = new Hono();

// Store message
messages.post('/', async (c) => {
  const body = await c.req.json<CreateMessageRequest>();
  const message = MessageService.createMessage(body);
  return c.json(successResponse(message), 201);
});

// Get message by UUID
messages.get('/:uuid', (c) => {
  const uuid = c.req.param('uuid');
  const message = MessageService.getMessageByUuid(uuid);
  return c.json(successResponse(message));
});

export { messages };
