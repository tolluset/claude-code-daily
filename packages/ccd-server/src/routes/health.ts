import { Hono } from 'hono';
import type { HealthResponse, ApiResponse } from '@ccd/types';

const health = new Hono();

const startTime = Date.now();
const VERSION = '0.1.0';

health.get('/', (c) => {
  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: {
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: VERSION
    }
  };
  return c.json(response);
});

export { health };
