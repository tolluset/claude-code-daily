import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DATA_DIR } from '../db';

const PID_FILE = join(DATA_DIR, 'server.pid');

export function writePidFile(): void {
  writeFileSync(PID_FILE, process.pid.toString());
}

export function removePidFile(): void {
  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
}

export function getPidFromFile(): number | null {
  if (!existsSync(PID_FILE)) {
    return null;
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

export function isServerRunning(): boolean {
  const pid = getPidFromFile();
  if (!pid) return false;

  try {
    // Check if process exists (signal 0 is used to verify process existence)
    process.kill(pid, 0);
    return true;
  } catch {
    // Remove PID file if process doesn't exist
    removePidFile();
    return false;
  }
}

// Remove PID file on process exit
process.on('exit', removePidFile);
process.on('SIGINT', () => {
  removePidFile();
  process.exit(0);
});
process.on('SIGTERM', () => {
  removePidFile();
  process.exit(0);
});
