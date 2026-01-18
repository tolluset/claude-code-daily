import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { health } from './routes/health';
import { sessions } from './routes/sessions';
import { messages } from './routes/messages';
import { stats } from './routes/stats';
import { sync } from './routes/sync';
import { resetIdleTimer, getIdleTimeMs } from './utils/timeout';
import { writePidFile, isServerRunning } from './utils/pid';
import { DATA_DIR, DB_PATH } from './db';

const PORT = 3847;
const IS_DEV = process.env.NODE_ENV === 'development' || process.argv.includes('--watch');

// Check if already running (skip in dev mode - bun --watch handles this)
if (!IS_DEV && isServerRunning()) {
  console.log('[CCD Server] Server is already running. Exiting.');
  process.exit(0);
}

// Create PID file (skip in dev mode)
if (!IS_DEV) {
  writePidFile();
}

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Reset timer on each request
app.use('*', (c, next) => {
  resetIdleTimer();
  return next();
});

// API routes
app.route('/api/v1/health', health);
app.route('/api/v1/sessions', sessions);
app.route('/api/v1/messages', messages);
app.route('/api/v1/stats', stats);
app.route('/api/v1/sync', sync);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Claude Code Daily Server',
    version: '0.1.0',
    dataDir: DATA_DIR,
    dbPath: DB_PATH,
    idleTimeMs: getIdleTimeMs()
  });
});

// Start server
console.log(`[CCD Server] Starting on http://localhost:${PORT}`);
console.log(`[CCD Server] Data directory: ${DATA_DIR}`);
console.log(`[CCD Server] Database: ${DB_PATH}`);

export default {
  port: PORT,
  fetch: app.fetch.bind(app)
};
