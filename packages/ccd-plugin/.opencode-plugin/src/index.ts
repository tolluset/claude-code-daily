import type { Plugin } from '@opencode-ai/plugin';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CCD_SERVER_URL = 'http://localhost:3847/api/v1';
const LOG_FILE = join(homedir(), '.ccd', 'opencode-plugin.log');

function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`;
  try {
    writeFileSync(LOG_FILE, logEntry, { flag: 'a' });
  } catch (error) {
    console.error('[CCD Plugin] Failed to write to log file:', error);
  }
}

interface SessionData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  project_name: string;
  git_branch: string;
  source: string;
}

interface MessageData {
  session_id: string;
  type: 'user' | 'assistant';
  content?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  timestamp?: string;
}

async function getGitBranch(directory: string): Promise<string> {
  try {
    const proc = Bun.spawn(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: directory,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const output = await new Response(proc.stdout).text();
    return output.trim();
  } catch {
    return '';
  }
}

async function ensureServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) {
      return true;
    }
  } catch {
  }

  try {
    const ccdDataDir = `${process.env.HOME}/.ccd`;
    await Bun.$`mkdir -p ${ccdDataDir}`;

    Bun.spawn(['bun', 'x', 'ccd-server'], {
      stdout: Bun.file(`${ccdDataDir}/server.log`),
      stderr: Bun.file(`${ccdDataDir}/server.log`),
      detached: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  } catch (error) {
    console.error('[CCD] Failed to start server:', error);
    return false;
  }
}

async function createSession(data: SessionData): Promise<void> {
  try {
    log('Creating session with data:', data);
    const response = await fetch(`${CCD_SERVER_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('Session creation error response:', errorText);
      console.error('Failed to create session:', errorText);
    } else {
      const result = await response.json();
      log('Session creation successful:', result);
    }
  } catch (error) {
    log('Session creation exception:', error);
    console.error('Failed to create session:', error);
  }
}

async function createMessage(data: MessageData): Promise<void> {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create message:', error.error);
    }
  } catch (error) {
    console.error('Failed to create message:', error);
  }
}

async function updateSessionSummary(sessionId: string, summary: string): Promise<void> {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/sessions/${sessionId}/summary`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to update session summary:', error.error);
    }
  } catch (error) {
    console.error('Failed to update session summary:', error);
  }
}

async function endSession(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/sessions/${sessionId}/end`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to end session:', error.error);
    }
  } catch (error) {
    console.error('Failed to end session:', error);
  }
}

export const CcdPlugin: Plugin = async ({ project, directory }) => {
  let sessionId: string | null = null;
  let messageCount = 0;

  await ensureServerRunning();
  log('CCD Plugin loaded for directory:', directory);

  return {
    event: async ({ event }) => {
      log('Received event:', event);
      const eventData = event as { type: string; [key: string]: unknown };

      switch (eventData.type) {
        case 'session.created': {
          log('Processing session.created event');
          const properties = eventData.properties as { info?: { id?: string } };
          const id = properties?.info?.id || (eventData.id as string);
          log('Extracted session ID:', id);
          if (!id)
            break;

          sessionId = id;
          messageCount = 0;

          const projectName = directory.split('/').pop() || 'unknown';
          const gitBranch = await getGitBranch(directory);

          await createSession({
            session_id: id,
            transcript_path: `opencode://${directory}/${id}`,
            cwd: directory,
            project_name: projectName,
            git_branch: gitBranch,
            source: 'opencode'
          });
          break;
        }

        case 'session.updated': {
          const properties = eventData.properties as { info?: { summary?: string } };
          const summary = properties?.info?.summary;
          if (sessionId && summary) {
            await updateSessionSummary(sessionId, summary);
          }
          break;
        }

        case 'session.idle': {
          const idleProperties = eventData.properties as { sessionID?: string };
          if (sessionId || idleProperties?.sessionID) {
            const id = sessionId || idleProperties.sessionID;
            if (id) {
              await endSession(id);
            }
            sessionId = null;
          }
          break;
        }

        case 'session.deleted': {
          sessionId = null;
          break;
        }
      }
    },

    'chat.message': async (input, output) => {
      const msgProperties = input as { sessionID?: string };
      if (!sessionId) {
        sessionId = msgProperties.sessionID || null;
      }

      const userMessage = output.message;
      const parts = output.parts;
      const content = parts.map(part => {
        if (part.type === 'text') return part.text;
        return '';
      }).join('\n');

      if (sessionId) {
        await createMessage({
          session_id: sessionId,
          type: 'user',
          content,
          timestamp: new Date().toISOString()
        });

        messageCount++;
        if (messageCount === 1) {
          await updateSessionSummary(sessionId, content.substring(0, 200));
        }
      }
    },

    'tool.execute.after': async (input, output) => {
      if (input.tool === 'bash' && sessionId) {
        const outputData = output as { title?: string; output?: string; [key: string]: unknown };
        
        if (outputData?.output) {
          await createMessage({
            session_id: sessionId,
            type: 'assistant',
            content: `Executed: ${outputData.title}\n${outputData.output}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  };
};

export default CcdPlugin;
