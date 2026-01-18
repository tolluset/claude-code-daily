import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { apiErrorHandler } from '../../utils/responses';

/**
 * Global middleware setup for the application
 */
export function setupGlobalMiddleware(app: Hono) {
  // Basic middleware
  app.use('*', cors());
  app.use('*', logger());
}

/**
 * API-specific middleware setup
 */
export function setupApiMiddleware(app: Hono, performScheduledClean: () => void, resetIdleTimer: () => void) {
  app.use('/api/*', apiErrorHandler());
  app.use('/api/*', async (c, next) => {
    performScheduledClean();
    resetIdleTimer();
    await next();
  });
}