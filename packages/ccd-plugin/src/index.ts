import type { Plugin } from "@opencode-ai/plugin"
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const LOG_FILE = join(homedir(), '.ccd', 'plugin.log')

function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`
  try {
    writeFileSync(LOG_FILE, logEntry, { flag: 'a' })
  } catch (error) {
    console.error('[CCD Plugin] Failed to write to log file:', error)
  }
}

const SERVER_URL = "http://localhost:3847"
const SERVER_HEALTH_URL = `${SERVER_URL}/api/v1/health`

const messageCountCache = new Map<string, number>()

export const ccdTracker: Plugin = async ({ client, project, $, directory }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "session.created") {
        const props = event.properties as unknown
        const session = (props as { info: { id: string; path: string; directory?: string } }).info

        try {
          // Skip server health check and startup - user runs server manually
          log('Creating session with ID:', session.id)
          await registerSession({
            session_id: session.id,
            transcript_path: `opencode://${session.path}`,
            cwd: session.directory || directory,
            project_name: (project as { title?: string })?.title,
            source: 'opencode'
          })
        } catch (error) {
          log('Error in session.created:', error)
          // Log more details for debugging
          if (error instanceof Error) {
            log('Error details:', {
              message: error.message,
              stack: error.stack
            })
          }
        }
      }

      if (event.type === "message.updated") {
        const props = event.properties as unknown
        const message = (props as { info: { id: string; sessionID: string; role: string; parts?: unknown; providerID?: string; modelID?: string; tokens?: { input?: number; output?: number } } }).info

        try {
          if (message.role === 'user') {
            const content = extractTextContent(message.parts as Array<{ type: string; text?: string }> | undefined)

            if (isFirstMessage(message.sessionID)) {
              log('Updating summary for session ID:', message.sessionID)
              await updateSessionSummary(message.sessionID, content)
              messageCountCache.set(message.sessionID, 1)
            }

            await saveMessage({
              session_id: message.sessionID,
              uuid: message.id,
              type: 'user',
              content: content
            })
          } else if (message.role === 'assistant') {
            const content = extractTextContent(message.parts as Array<{ type: string; text?: string }> | undefined)

            await saveMessage({
              session_id: message.sessionID,
              uuid: message.id,
              type: 'assistant',
              content: content,
              model: message.providerID && message.modelID
                ? `${message.providerID}/${message.modelID}`
                : null,
              input_tokens: message.tokens?.input || null,
              output_tokens: message.tokens?.output || null
            })
          }
        } catch (error) {
          log('Error in message.updated:', error)
          if (error instanceof Error) {
            log('Error details:', {
              message: error.message,
              stack: error.stack?.split('\n')[0]
            })
          }
        }
      }

      if (event.type === "session.idle") {
        const props = event.properties as unknown
        const sessionID = (props as { sessionID: string }).sessionID

        try {
          await endSession(sessionID)
          messageCountCache.delete(sessionID)
        } catch (error) {
          log('Error in session.idle:', error)
          if (error instanceof Error) {
            log('Error details:', {
              message: error.message,
              stack: error.stack?.split('\n')[0]
            })
          }
        }
      }
    }
  }
}

function extractTextContent(parts?: Array<{ type: string; text?: string }>): string {
  if (!parts) return ''
  
  return parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => part.text)
    .join('')
}

function isFirstMessage(sessionId: string): boolean {
  const count = messageCountCache.get(sessionId) ?? 0
  return count === 0
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(SERVER_HEALTH_URL)
    return response.ok
  } catch {
    return false
  }
}

async function startServer($: unknown): Promise<void> {
  if (typeof $ === 'object' && $ !== null && 'shell' in $) {
    const shell = $ as { shell: (cmd: string) => Promise<{ exitCode: number; stdout: string; stderr: string }> }

    // Try to start ccd-server using installed command
    await shell.shell('nohup ccd-server > ~/.ccd/server.log 2>&1 &')
  }
}

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    if (await checkServerHealth()) return
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

async function registerSession(data: {
  session_id: string
  transcript_path: string
  cwd: string
  project_name?: string
  source: 'claude' | 'opencode'
}): Promise<void> {
  log('Making API call to register session:', data)
  const response = await fetch(`${SERVER_URL}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  log('Session registration response status:', response.status)
  if (!response.ok) {
    const errorText = await response.text()
    log('Session registration error response:', errorText)
    throw new Error(`Failed to register session: ${response.status} - ${errorText}`)
  } else {
    const result = await response.json()
    log('Session registration successful:', result)
  }
}

async function saveMessage(data: {
  session_id: string
  uuid?: string
  type: 'user' | 'assistant'
  content?: string
  model?: string | null
  input_tokens?: number | null
  output_tokens?: number | null
}): Promise<void> {
  const response = await fetch(`${SERVER_URL}/api/v1/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Failed to save message: ${response.status}`)
  }
}

async function updateSessionSummary(sessionId: string, summary: string): Promise<void> {
  log('Making API call to update session summary for:', sessionId)
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${sessionId}/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary })
  })

  log('Session summary update response status:', response.status)
  if (!response.ok) {
    const errorText = await response.text()
    log('Session summary update error response:', errorText)
    throw new Error(`Failed to update session summary: ${response.status} - ${errorText}`)
  } else {
    const result = await response.json()
    log('Session summary update successful:', result)
  }
}

async function endSession(sessionId: string): Promise<void> {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${sessionId}/end`, {
    method: 'POST'
  })
  
  if (!response.ok) {
    throw new Error(`Failed to end session: ${response.status}`)
  }
}
