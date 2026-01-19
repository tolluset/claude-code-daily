/**
 * Common types for CCD client
 */

export interface SessionData {
  session_id: string;
  transcript_path: string;
  cwd: string;
  project_name: string;
  git_branch: string;
  source: 'claude' | 'opencode';
}

export interface MessageData {
  session_id: string;
  type: 'user' | 'assistant';
  content?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  timestamp?: string;
}

export interface TranscriptSyncData {
  session_id: string;
  transcript_path: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ClientConfig {
  serverUrl: string;
  logEnabled?: boolean;
  timeout?: number;
}
