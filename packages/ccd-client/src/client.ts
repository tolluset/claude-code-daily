/**
 * CCDClient - Universal client for CCD server
 * Handles all API interactions in a platform-agnostic way
 */

import type { EventAdapter, EventAction } from './events/base';
import type { SessionData, MessageData, TranscriptSyncData, ApiResponse, ClientConfig } from './types';

export class CCDClient {
  private config: Required<ClientConfig>;
  private adapter: EventAdapter;

  constructor(config: ClientConfig, adapter: EventAdapter) {
    this.config = {
      serverUrl: config.serverUrl,
      logEnabled: config.logEnabled ?? false,
      timeout: config.timeout ?? 5000,
    };
    this.adapter = adapter;
  }

  /**
   * Main event handler - converts and dispatches events
   */
  async handleEvent(event: unknown): Promise<void> {
    const action = this.adapter.parseEvent(event);
    if (!action || action.type === 'ignore') {
      return;
    }

    this.log('Handling event action:', action);

    try {
      switch (action.type) {
        case 'session.create':
          await this.createSession(action.data);
          break;
        case 'session.update':
          await this.updateSessionSummary(action.sessionId, action.summary);
          break;
        case 'message.create':
          await this.createMessage(action.data);
          break;
        case 'transcript.sync':
          await this.syncTranscript(action.data);
          break;
        case 'session.end':
          await this.endSession(action.sessionId);
          break;
      }
    } catch (error) {
      this.log('Error handling event:', error);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(data: SessionData): Promise<boolean> {
    try {
      this.log('Creating session:', data.session_id);

      const response = await fetch(`${this.config.serverUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Session creation failed:', errorText);
        return false;
      }

      const result = await response.json() as ApiResponse;
      this.log('Session created successfully:', result);
      return true;
    } catch (error) {
      this.log('Session creation error:', error);
      return false;
    }
  }

  /**
   * Update session summary
   */
  async updateSessionSummary(sessionId: string, summary: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/sessions/${sessionId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Failed to update session summary:', errorText);
      }
    } catch (error) {
      this.log('Update session summary error:', error);
    }
  }

  /**
   * Create a message
   */
  async createMessage(data: MessageData): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Failed to create message:', errorText);
      }
    } catch (error) {
      this.log('Create message error:', error);
    }
  }

  /**
   * Sync transcript (for Claude Code Stop hook)
   */
  async syncTranscript(data: TranscriptSyncData): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/sync/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Failed to sync transcript:', errorText);
      } else {
        this.log('Transcript synced successfully');
      }
    } catch (error) {
      this.log('Sync transcript error:', error);
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/sessions/${sessionId}/end`, {
        method: 'POST',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log('Failed to end session:', errorText);
      }
    } catch (error) {
      this.log('End session error:', error);
    }
  }

  /**
   * Check server health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Internal logging
   */
  private log(message: string, data?: unknown): void {
    if (this.config.logEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`[CCDClient ${timestamp}] ${message}`, data ?? '');
    }
  }
}
