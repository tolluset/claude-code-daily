/**
 * Event Adapter Pattern
 * Converts platform-specific events to common actions
 */

import type { SessionData, MessageData, TranscriptSyncData } from '../types';

export type EventAction =
  | { type: 'session.create'; data: SessionData }
  | { type: 'session.update'; sessionId: string; summary: string }
  | { type: 'message.create'; data: MessageData }
  | { type: 'transcript.sync'; data: TranscriptSyncData }
  | { type: 'session.end'; sessionId: string }
  | { type: 'ignore' }; // For events we don't handle

/**
 * EventAdapter interface
 * Each platform implements this to convert their events to EventActions
 */
export interface EventAdapter {
  /**
   * Parse platform-specific event and convert to EventAction
   * Returns null if event should be ignored
   */
  parseEvent(event: unknown): EventAction | null;
}
