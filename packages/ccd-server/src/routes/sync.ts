import { Hono } from 'hono';
import { readFileSync, existsSync } from 'fs';
import { bulkInsertMessages, getSession } from '../db/queries';
import { validateRequired } from '../utils/validation';
import type {
  ApiResponse,
  TranscriptSyncRequest,
  TranscriptMessage,
  TranscriptContentBlock,
  CreateMessageRequest
} from '@ccd/types';

const sync = new Hono();

// Convert transcript content to text
function extractTextFromContent(content: string | TranscriptContentBlock[]): string {
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

// Parse transcript
function parseTranscript(filePath: string): TranscriptMessage[] {
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
      if (msg.type === 'human' || msg.type === 'assistant') {
        messages.push(msg);
      }
    } catch {
      // Ignore lines that fail to parse
    }
  }

  return messages;
}

// Sync transcript
sync.post('/transcript', async (c) => {
  try {
    const body = await c.req.json<TranscriptSyncRequest>();

    const validation = validateRequired(body, ['session_id', 'transcript_path']);
    if (!validation.valid) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: `Missing required fields: ${validation.missing.join(', ')}`
      }, 400);
    }

    const session = getSession(body.session_id);
    if (!session) {
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Session not found'
      }, 404);
    }

    const transcriptMessages = parseTranscript(body.transcript_path);

    const messagesToInsert: CreateMessageRequest[] = transcriptMessages.map((msg) => ({
      session_id: body.session_id,
      uuid: msg.uuid,
      type: msg.type === 'human' ? 'user' : 'assistant',
      content: extractTextFromContent(msg.message.content),
      model: msg.message.model,
      input_tokens: msg.message.usage?.input_tokens,
      output_tokens: msg.message.usage?.output_tokens
    }));

    const inserted = bulkInsertMessages(messagesToInsert);

    return c.json<ApiResponse<{ inserted: number; total: number }>>({
      success: true,
      data: {
        inserted,
        total: transcriptMessages.length
      }
    });
  } catch (error) {
    return c.json<ApiResponse<null>>({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { sync };
