import type { Plugin } from '@opencode-ai/plugin';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CCD_SERVER_URL = 'http://localhost:3847/api/v1';
const LOG_FILE = join(homedir(), '.ccd', 'plugin.log');

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

async function ensureServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function startServer(): Promise<void> {
  try {
    await Bun.spawn(['ccd-server'], {
      detached: true,
      stdout: 'inherit',
      stderr: 'inherit'
    }).exited;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Failed to start CCD server:', error);
  }
}

async function createSession(data: SessionData): Promise<void> {
  try {
    log('Making API call to create session:', data);
    const response = await fetch(`${CCD_SERVER_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    log('Session creation response status:', response.status);
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

export const CCDPlugin: Plugin = async ({ project, directory }) => {
  let sessionId: string | null = null;

  return {
    event: async ({ event }) => {
      log('Received event:', event);
      const eventData = event as { type: string; [key: string]: unknown };

      switch (eventData.type) {
        case 'session.created': {
          log('Processing session.created event');
          const properties = eventData.properties as { sessionID?: string };
          const id = properties?.sessionID || (eventData.id as string) || (eventData.session as { id: string })?.id;
          log('Extracted session ID:', id);
          if (!id)
            break;

          sessionId = id;

          // Skip server health check and startup - user runs server manually
          log('Creating session with data:', {
            session_id: id,
            transcript_path: typeof project === 'string' ? project : (project as { path?: string })?.path || directory,
            cwd: directory
          });

          await createSession({
            session_id: id,
            transcript_path: typeof project === 'string' ? project : (project as { path?: string })?.path || directory,
            cwd: directory
          });
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
        // Handle other part types safely
        return '';
      }).join('\n');

      if (sessionId) {
        await createMessage({
          session_id: sessionId,
          type: 'user',
          content,
          timestamp: new Date().toISOString()
        });
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
