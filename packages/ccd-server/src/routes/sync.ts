import { Hono } from 'hono';
import { SyncService } from '../services';
import { successResponse, errorResponse } from '../utils/responses';
import { ApiError } from '../utils/errors';
import type {
  ApiResponse,
  TranscriptSyncRequest
} from '@ccd/types';

const sync = new Hono();

// Sync transcript
sync.post('/transcript', async (c) => {
  try {
    const body = await c.req.json<TranscriptSyncRequest>();
    const result = SyncService.syncTranscript(body.session_id, body.transcript_path);

    if (result.deleted) {
      return c.json(successResponse({
        deleted: result.deleted,
        reason: result.reason
      }));
    }

    return c.json(successResponse({
      inserted: result.inserted,
      total: result.total
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json(errorResponse(error.message), { status: error.statusCode } as any);
    }
    throw error;
  }
});

export { sync };
