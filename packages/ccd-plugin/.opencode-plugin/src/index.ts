/**
 * CCD OpenCode Plugin (Refactored)
 * Now uses @ccd/client for all API interactions
 */

import type { Plugin } from '@opencode-ai/plugin';
import { CCDClient, OpenCodeAdapter } from '@ccd/client';
import { spawn } from 'node:child_process';

const CCD_SERVER_URL = 'http://localhost:3847/api/v1';

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
      await Bun.$`mkdir -p ${ccdDataDir}`;

      Bun.spawn(['bun', 'x', 'ccd-server'], {
        stdout: Bun.file(`${ccdDataDir}/server.log`),
        stderr: Bun.file(`${ccdDataDir}/server.log`),
        detached: true,
      });

      // Wait for server to start
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const response = await fetch(`${CCD_SERVER_URL}/health`, {
            signal: AbortSignal.timeout(2000),
          });
          if (response.ok) return true;
        } catch {
          // Continue retrying
        }
      }
    } catch (error) {
      console.error('[CCD] Failed to start server:', error);
    }
  }
  return false;
}

export const CcdPlugin: Plugin = async ({ project, directory }) => {
  await ensureServerRunning();

  const projectName = directory.split('/').pop() || 'unknown';
  const gitBranch = await getGitBranch(directory);

  const adapter = new OpenCodeAdapter(directory, projectName, gitBranch);
  const client = new CCDClient(
    { serverUrl: CCD_SERVER_URL, logEnabled: false },
    adapter
  );

  return {
    event: async ({ event }) => {
      await client.handleEvent(event);

      // Reset sessionId if session creation failed
      if ((event as any).type === 'session.created') {
        const sessionId = adapter.getSessionId();
        if (!sessionId) {
          adapter.resetSessionId();
        }
      }
    },

    'chat.message': async (input, output) => {
      const action = adapter.parseChatMessage(input as any, output as any);
      if (action) {
        await client.handleEvent(action);
      }
    },
  };
};
