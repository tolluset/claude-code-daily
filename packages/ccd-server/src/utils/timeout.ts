// Server auto-shutdown timer
// Automatically shuts down after 1 hour of inactivity

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

let timeoutId: Timer | null = null;
let lastActivity = Date.now();

export function resetIdleTimer(): void {
  lastActivity = Date.now();

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => {
    console.log('[CCD Server] Idle timeout reached. Shutting down...');
    process.exit(0);
  }, IDLE_TIMEOUT_MS);
}

export function getLastActivity(): number {
  return lastActivity;
}

export function getIdleTimeMs(): number {
  return Date.now() - lastActivity;
}

// Start initial timer
resetIdleTimer();
