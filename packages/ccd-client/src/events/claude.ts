/**
 * Claude Code Event Adapter
 * Converts Claude Code hook events to common EventActions
 */

import type { EventAdapter, EventAction } from './base';
import type { SessionData, MessageData, TranscriptSyncData } from '../types';

interface ClaudeCodeHookContext {
  hook_event: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  project_name?: string;
  git_branch?: string;
  user_message?: string;
  timestamp?: string;
}

export class ClaudeCodeAdapter implements EventAdapter {
  parseEvent(event: unknown): EventAction | null {
    const context = event as ClaudeCodeHookContext;

    switch (context.hook_event) {
      case 'SessionStart':
        return this.handleSessionStart(context);

      case 'UserPromptSubmit':
        return this.handleUserPrompt(context);

      case 'Stop':
        return this.handleStop(context);

      default:
        return { type: 'ignore' };
    }
  }

  private handleSessionStart(context: ClaudeCodeHookContext): EventAction | null {
    if (!context.session_id || !context.transcript_path || !context.cwd) {
      return null;
    }

    const data: SessionData = {
      session_id: context.session_id,
      transcript_path: context.transcript_path,
      cwd: context.cwd,
      project_name: context.project_name || this.extractProjectName(context.cwd),
      git_branch: context.git_branch || '',
      source: 'claude',
    };

    return {
      type: 'session.create',
      data,
    };
  }

  private handleUserPrompt(context: ClaudeCodeHookContext): EventAction | null {
    if (!context.session_id || !context.user_message) {
      return null;
    }

    const data: MessageData = {
      session_id: context.session_id,
      type: 'user',
      content: context.user_message,
      timestamp: context.timestamp || new Date().toISOString(),
    };

    return {
      type: 'message.create',
      data,
    };
  }

  private handleStop(context: ClaudeCodeHookContext): EventAction | null {
    if (!context.session_id || !context.transcript_path) {
      return null;
    }

    // Stop hook syncs transcript (which also marks session as ended)
    const data: TranscriptSyncData = {
      session_id: context.session_id,
      transcript_path: context.transcript_path,
    };

    return {
      type: 'transcript.sync',
      data,
    };
  }

  private extractProjectName(cwd: string): string {
    return cwd.split('/').pop() || 'unknown';
  }
}
