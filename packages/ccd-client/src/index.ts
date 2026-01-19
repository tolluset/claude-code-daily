/**
 * CCD Client - Universal client for OpenCode, Claude Code, and other platforms
 * @packageDocumentation
 */

export { CCDClient } from './client';
export { OpenCodeAdapter } from './events/opencode';
export { ClaudeCodeAdapter } from './events/claude';
export type { EventAdapter, EventAction } from './events/base';
export type {
  SessionData,
  MessageData,
  TranscriptSyncData,
  ApiResponse,
  ClientConfig,
} from './types';
