#!/usr/bin/env node
/**
 * CCD Claude Code Plugin (Refactored)
 * Now uses @ccd/client for all API interactions
 */

import { CCDClient, ClaudeCodeAdapter } from '@ccd/client';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const CCD_SERVER_URL = 'http://localhost:3847/api/v1';
const LOG_FILE = `${process.env.HOME}/.ccd/hook.log`;

function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`;
  try {
    const fs = require('node:fs');
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error('[CCD] Failed to write to log file:', error);
  }
}

async function ensureServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return true;
  } catch {
    // Server not running, try to start
    try {
      const ccdDataDir = `${process.env.HOME}/.ccd`;
      const { mkdirSync, existsSync } = require('node:fs');
      if (!existsSync(ccdDataDir)) {
        mkdirSync(ccdDataDir, { recursive: true });
      }

      const serverPath = `${process.env.CLAUDE_PLUGIN_ROOT}/scripts/server.js`;
      spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore',
      }).unref();

      // Wait for server to start
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const response = await fetch(`${CCD_SERVER_URL}/health`, {
            signal: AbortSignal.timeout(2000),
          });
          if (response.ok) {
            log('Server started successfully');
            return true;
          }
        } catch {
          // Continue retrying
        }
      }
    } catch (error) {
      log('Failed to start server', error);
    }
  }
  return false;
}

async function getGitBranch(directory: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: directory,
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let output = '';
    proc.stdout?.on('data', (data) => { output += data; });
    proc.on('close', () => resolve(output.trim()));
    proc.on('error', () => resolve(''));
  });
}

async function main() {
  try {
    // Read hook context from stdin
    const stdinBuffer: Buffer[] = [];
    for await (const chunk of process.stdin) {
      stdinBuffer.push(chunk);
    }
    const hookContextStr = Buffer.concat(stdinBuffer).toString('utf-8');

    if (!hookContextStr.trim()) {
      log('No hook context provided');
      process.exit(0);
    }

    const hookContext = JSON.parse(hookContextStr);
    log('Received hook context', hookContext);

    // Determine hook type from command line args
    const hookType = process.argv[2]; // 'SessionStart', 'UserPromptSubmit', 'Stop'

    if (!hookType) {
      log('No hook type specified');
      process.exit(0);
    }

    log(`Processing ${hookType} hook`);

    // Ensure server is running for SessionStart
    if (hookType === 'SessionStart') {
      await ensureServerRunning();
    }

    // Enrich context with git branch for SessionStart
    if (hookType === 'SessionStart' && hookContext.cwd) {
      if (!hookContext.git_branch) {
        hookContext.git_branch = await getGitBranch(hookContext.cwd);
      }
      if (!hookContext.project_name) {
        hookContext.project_name = hookContext.cwd.split('/').pop() || 'unknown';
      }
    }

    // Add hook_event to context
    const eventContext = {
      ...hookContext,
      hook_event: hookType,
    };

    // Create client and handle event
    const adapter = new ClaudeCodeAdapter();
    const client = new CCDClient(
      { serverUrl: CCD_SERVER_URL, logEnabled: false },
      adapter
    );

    await client.handleEvent(eventContext);
    log(`${hookType} hook completed successfully`);

    // Auto-extract insights for Stop hook (async, non-blocking)
    if (hookType === 'Stop' && hookContext.session_id) {
      const scriptDir = `${process.env.CLAUDE_PLUGIN_ROOT}/hooks/scripts`;
      spawn('bash', [`${scriptDir}/auto-extract-insights.sh`, hookContext.session_id], {
        detached: true,
        stdio: 'ignore',
      }).unref();
      log('Triggered auto-extract insights in background');
    }

    process.exit(0);
  } catch (error) {
    log('Hook handler error', error);
    process.exit(1);
  }
}

main();
