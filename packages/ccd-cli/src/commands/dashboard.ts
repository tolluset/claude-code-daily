import chalk from 'chalk';
import open from 'open';
import { checkServerHealth } from '../api';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const DASHBOARD_PORT = 3848;
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`;

export async function openDashboard(): Promise<void> {
  // Check server status
  const isServerUp = await checkServerHealth();
  if (!isServerUp) {
    console.log(chalk.yellow('CCD server is not running.'));
    console.log(chalk.gray('The server will start automatically when you start a Claude Code session.'));
    console.log();
    console.log(chalk.gray('Or start the server manually:'));
    console.log(chalk.white('  ccd-server'));
    return;
  }

  // Check if dashboard is already running
  const isDashboardRunning = await checkDashboardHealth();

  if (!isDashboardRunning) {
    // Start dashboard server
    console.log(chalk.gray('Starting dashboard...'));

    const started = await startDashboard();
    if (!started) {
      console.log(chalk.red('Failed to start dashboard.'));
      return;
    }

    // Wait for dashboard to start
    await waitForDashboard();
  }

  // Open dashboard in browser
  console.log(chalk.green('Opening dashboard...'));
  await open(DASHBOARD_URL);
  console.log(chalk.gray(`URL: ${DASHBOARD_URL}`));
}

async function checkDashboardHealth(): Promise<boolean> {
  try {
    const response = await fetch(DASHBOARD_URL, {
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function startDashboard(): Promise<boolean> {
  const ccdDataDir = join(process.env.HOME || '~', '.ccd');

  // Check if ccd-dashboard is installed
  try {
    // Development: Run vite directly
    const dashboardDir = join(__dirname, '../../ccd-dashboard');
    if (existsSync(join(dashboardDir, 'package.json'))) {
      spawn('bun', ['run', 'dev'], {
        cwd: dashboardDir,
        detached: true,
        stdio: 'ignore'
      }).unref();
      return true;
    }

    // Production: Serve built dashboard
    // TODO: Production build serving logic
    return false;
  } catch {
    return false;
  }
}

async function waitForDashboard(maxWait = 10000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (await checkDashboardHealth()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
