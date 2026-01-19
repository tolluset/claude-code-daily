import { Hono } from 'hono';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

import { health, sessions, messages, stats, sync, search, insights, dailyReport, setupGlobalMiddleware, setupApiMiddleware } from './routes';
import { resetIdleTimer, getIdleTimeMs } from './utils/timeout';
import { writePidFile, isServerRunning } from './utils/pid';
import { DATA_DIR, DB_PATH } from './db';
import { cleanEmptySessions } from './db/queries';
import { SERVER_PORT, DEFAULT_CLEANUP_INTERVAL_MS } from '@ccd/types';

const IS_DEV = process.env.NODE_ENV === 'development' || process.argv.includes('--watch');

const __dirname = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIR = process.env.CLAUDE_PLUGIN_ROOT
  ? join(process.env.CLAUDE_PLUGIN_ROOT, 'dashboard/dist')
  : join(__dirname, '../dashboard');

// Cache dashboard index.html
let dashboardIndexCache: string | null = null;
function getDashboardIndex(): string {
  if (!dashboardIndexCache) {
    dashboardIndexCache = readFileSync(join(DASHBOARD_DIR, 'index.html'), 'utf-8');
  }
  return dashboardIndexCache;
}

// Serve static file
function serveStaticFile(path: string, contentType: string) {
  try {
    const content = readFileSync(join(DASHBOARD_DIR, path), 'utf-8');
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch {
    return null;
  }
}

// Check if already running (skip in dev mode - bun --watch handles this)
if (!IS_DEV && isServerRunning()) {
  console.log('[CCD Server] Server is already running. Exiting.');
  process.exit(0);
}

// Create PID file (skip in dev mode)
if (!IS_DEV) {
  writePidFile();
}

// Clean empty sessions on startup and on user activity
let lastCleanupTime = Date.now();

function performScheduledClean() {
  const now = Date.now();
  if (now - lastCleanupTime < DEFAULT_CLEANUP_INTERVAL_MS) {
    return;
  }

  try {
    const result = cleanEmptySessions();
    if (result.deleted.length > 0) {
      console.log(`[CCD Server] Cleaned ${result.deleted.length} empty session(s): ${result.deleted.join(', ')}`);
    }
    lastCleanupTime = now;
  } catch (error) {
    console.error('[CCD Server] Error cleaning empty sessions:', error);
  }
}

const app = new Hono();

// Setup middleware
setupGlobalMiddleware(app);
setupApiMiddleware(app, performScheduledClean, resetIdleTimer);

// API routes (must be defined first)
app.route('/api/v1/health', health);
app.route('/api/v1/sessions', sessions);
app.route('/api/v1/messages', messages);
app.route('/api/v1/stats', stats);
app.route('/api/v1/sync', sync);
app.route('/api/v1/search', search);
app.route('/api/v1/insights', insights);
app.route('/api/v1/daily-report', dailyReport);

// Dashboard static files
app.get('/', (c) => {
  return c.html(getDashboardIndex());
});

app.get('/assets/:filename', (c) => {
  const filename = c.req.param('filename');
  const ext = filename.split('.').pop();
  const contentTypes: Record<string, string> = {
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json'
  };
  const contentType = contentTypes[ext || ''] || 'application/octet-stream';
  const file = serveStaticFile(`assets/${filename}`, contentType);
  if (file) {
    return file;
  }
  return c.notFound();
});

app.get('/*', (c) => {
  return c.html(getDashboardIndex());
});

// Start server
console.log(`[CCD Server] Starting on http://localhost:${SERVER_PORT}`);
console.log(`[CCD Server] Data directory: ${DATA_DIR}`);
console.log(`[CCD Server] Database: ${DB_PATH}`);
console.log(`[CCD Server] Dashboard: ${DASHBOARD_DIR}`);

export default {
  port: SERVER_PORT,
  fetch: app.fetch.bind(app)
};
