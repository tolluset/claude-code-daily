import { createMessage, getMessageByUuid } from '../db/queries';
import { validateRequired, validateStringEnum } from '../utils/errors';
import type { Message, CreateMessageRequest } from '@ccd/types';

/**
 * Service layer for message-related business logic
 */
export class MessageService {
  /**
   * Create a new message
   */
  static createMessage(data: CreateMessageRequest): Message {
    // Manual validation since CreateMessageRequest doesn't extend Record<string, unknown>
    if (!data.session_id || !data.type) {
      throw new Error('Missing required fields: session_id, type');
    }

    validateStringEnum(data.type, ['user', 'assistant'], 'type');

    return createMessage(data);
  }

  /**
   * Get a message by UUID
   */
  static getMessageByUuid(uuid: string): Message {
    const message = getMessageByUuid(uuid);
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  }
}