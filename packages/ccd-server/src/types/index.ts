// Re-export API utilities
export { API_BASE, fetchApi, checkServerHealth } from './api';

// Session types
export interface Session {
  id: string;
  transcript_path: string;
  cwd: string;
  project_name: string | null;
  git_branch: string | null;
  started_at: string;
  ended_at: string | null;
  is_bookmarked: boolean;
  bookmark_note: string | null;
  summary: string | null;
}

export interface CreateSessionRequest {
  session_id: string;
  transcript_path: string;
  cwd: string;
  project_name?: string;
  git_branch?: string;
}

// Message types
export interface Message {
  id: number;
  session_id: string;
  uuid: string | null;
  type: 'user' | 'assistant';
  content: string | null;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  timestamp: string;
}

export interface CreateMessageRequest {
  session_id: string;
  uuid?: string;
  type: 'user' | 'assistant';
  content?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
}

// Daily stats types
export interface DailyStats {
  date: string;
  session_count: number;
  message_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  uptime: number;
  version: string;
}

export interface SessionListResponse {
  sessions: Session[];
  total: number;
}

export interface TodayStatsResponse {
  stats: DailyStats;
  sessions: Session[];
}

// Bookmark types
export interface BookmarkRequest {
  note?: string;
}

// Transcript sync types
export interface TranscriptSyncRequest {
  session_id: string;
  transcript_path: string;
}

// Claude Code transcript types
export interface TranscriptMessage {
  uuid: string;
  type: 'user' | 'assistant';
  message: {
    content: string | TranscriptContentBlock[];
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
  timestamp: string;
}

export interface TranscriptContentBlock {
  type: string;
  text?: string;
  tool_use_id?: string;
  content?: string;
}

// Hook context types
export interface HookContext {
  session_id: string;
  transcript_path: string;
  cwd: string;
  prompt?: string;
}
