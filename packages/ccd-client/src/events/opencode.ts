/**
 * OpenCode Event Adapter
 * Converts OpenCode events to common EventActions
 */

import type { EventAdapter, EventAction } from './base';
import type { SessionData, MessageData } from '../types';

interface OpenCodeEvent {
  type: string;
  id?: string;
  properties?: {
    info?: {
      id?: string;
      summary?: string;
    };
    sessionID?: string;
  };
}

interface OpenCodeMessageInput {
  sessionID?: string;
}

interface OpenCodeMessageOutput {
  message?: string;
  parts?: Array<{
    type: string;
    text?: string;
  }>;
}

export class OpenCodeAdapter implements EventAdapter {
  private sessionId: string | null = null;
  private directory: string;
  private projectName: string;
  private gitBranch: string;

  constructor(directory: string, projectName: string, gitBranch: string = '') {
    this.directory = directory;
    this.projectName = projectName;
    this.gitBranch = gitBranch;
  }

  parseEvent(event: unknown): EventAction | null {
    const e = event as OpenCodeEvent;

    switch (e.type) {
      case 'session.created':
        return this.handleSessionCreated(e);

      case 'session.updated':
        return this.handleSessionUpdated(e);

      case 'session.idle':
      case 'session.deleted':
        return this.handleSessionEnd(e);

      default:
        return { type: 'ignore' };
    }
  }

  /**
   * Parse chat.message event (called separately by plugin)
   */
  parseChatMessage(input: OpenCodeMessageInput, output: OpenCodeMessageOutput): EventAction | null {
    // Update sessionId if provided
    if (!this.sessionId && input.sessionID) {
      this.sessionId = input.sessionID;
    }

    if (!this.sessionId) {
      return null;
    }

    // Extract content from parts
    const content = output.parts
      ?.map(part => {
        if (part.type === 'text') return part.text || '';
        return '';
      })
      .join('\n') || '';

    return {
      type: 'message.create',
      data: {
        session_id: this.sessionId,
        type: 'user',
        content,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private handleSessionCreated(event: OpenCodeEvent): EventAction | null {
    const id = event.properties?.info?.id || event.id;
    if (!id) {
      return null;
    }

    this.sessionId = id;

    const data: SessionData = {
      session_id: id,
      transcript_path: `opencode://${this.directory}/${id}`,
      cwd: this.directory,
      project_name: this.projectName,
      git_branch: this.gitBranch,
      source: 'opencode',
    };

    return {
      type: 'session.create',
      data,
    };
  }

  private handleSessionUpdated(event: OpenCodeEvent): EventAction | null {
    const summary = event.properties?.info?.summary;
    if (!this.sessionId || !summary) {
      return null;
    }

    return {
      type: 'session.update',
      sessionId: this.sessionId,
      summary,
    };
  }

  private handleSessionEnd(event: OpenCodeEvent): EventAction | null {
    const sessionId = this.sessionId || event.properties?.sessionID;
    if (!sessionId) {
      return null;
    }

    // Clear local session state
    this.sessionId = null;

    return {
      type: 'session.end',
      sessionId,
    };
  }

  /**
   * Get current session ID (for plugin state management)
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Reset session ID (for plugin state management)
   */
  resetSessionId(): void {
    this.sessionId = null;
  }
}
