import type { Plugin } from '@opencode-ai/plugin';

const CCD_SERVER_URL = 'http://localhost:3847/api/v1';

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
    const response = await fetch(`${CCD_SERVER_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create session:', error.error);
    }
  } catch (error) {
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
      const eventData = event as { type: string; [key: string]: unknown };

      switch (eventData.type) {
        case 'session.created': {
          const properties = eventData.properties as { sessionID?: string };
          const id = properties?.sessionID || (eventData.id as string) || (eventData.session as { id: string })?.id;
          if (!id)
            break;

          sessionId = id;

          const isRunning = await ensureServerRunning();
          if (!isRunning) {
            await startServer();
          }

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
        if (part.type === 'image') return '[Image]';
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
