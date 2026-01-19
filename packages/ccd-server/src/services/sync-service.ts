import { readFileSync, existsSync } from 'node:fs';
import { bulkInsertMessages, getSession, updateSessionSummary, deleteSession, decrementSessionCount, endSession } from '../db/queries';
import type {
  TranscriptSyncRequest,
  TranscriptMessage,
  TranscriptContentBlock,
  CreateMessageRequest
} from '@ccd/types';

/**
 * Service layer for transcript synchronization business logic
 */
export class SyncService {
  /**
   * Convert transcript content to text
   */
  private static extractTextFromContent(content: string | TranscriptContentBlock[]): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter((block) => block.type === 'text' && block.text)
        .map((block) => block.text)
        .join('\n');
    }

    return '';
  }

  /**
   * Parse transcript file
   */
  private static parseTranscript(filePath: string): TranscriptMessage[] {
    if (!existsSync(filePath)) {
      return [];
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const messages: TranscriptMessage[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line) as TranscriptMessage;
        if (msg.type === 'user' || msg.type === 'assistant') {
          messages.push(msg);
        }
      } catch {
        // Ignore lines that fail to parse
      }
    }

    return messages;
  }

  /**
   * Sync transcript for a session
   */
  static syncTranscript(sessionId: string, transcriptPath: string): {
    inserted: number;
    total: number;
    deleted?: boolean;
    reason?: string;
  } {
    const session = getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const transcriptMessages = SyncService.parseTranscript(transcriptPath);

    // Count user messages
    const userMessageCount = transcriptMessages.filter(msg => msg.type === 'user').length;

    // If no user messages, delete the session and decrement stats
    if (userMessageCount === 0) {
      const sessionDate = session.started_at.split(' ')[0]; // Extract "YYYY-MM-DD"

      deleteSession(sessionId);
      decrementSessionCount(sessionDate);

      return {
        inserted: 0,
        total: transcriptMessages.length,
        deleted: true,
        reason: 'no_user_messages'
      };
    }

    // Filter out messages with empty content (e.g., tool_use only, thinking blocks)
    const messagesToInsert: CreateMessageRequest[] = transcriptMessages
      .map((msg) => ({
        session_id: sessionId,
        uuid: msg.uuid,
        type: (msg.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: SyncService.extractTextFromContent(msg.message.content),
        model: msg.message.model,
        input_tokens: msg.message.usage?.input_tokens,
        output_tokens: msg.message.usage?.output_tokens
      }))
      .filter((msg) => msg.content.trim() !== '');

    const inserted = bulkInsertMessages(messagesToInsert);

    // Extract first user message as session summary (truncate to 100 chars)
    const firstUserMessage = transcriptMessages.find((msg) => msg.type === 'user');
    if (firstUserMessage && !session.summary) {
      const content = SyncService.extractTextFromContent(firstUserMessage.message.content);
      const summary = content.length > 100 ? content.slice(0, 97) + '...' : content;
      updateSessionSummary(sessionId, summary);
    }

    // Mark session as ended
    endSession(sessionId);

    return {
      inserted,
      total: transcriptMessages.length
    };
  }
}