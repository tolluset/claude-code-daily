// Re-export API utilities and constants
export { API_BASE, fetchApi, checkServerHealth } from './api';
export * from './constants';

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
  source: 'claude' | 'opencode';
}

export interface CreateSessionRequest {
  session_id: string;
  transcript_path: string;
  cwd: string;
  project_name?: string;
  git_branch?: string;
  source?: 'claude' | 'opencode';
}

export interface UpdateSessionRequest {
  summary?: string;
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
  input_cost: number | null;
  output_cost: number | null;
  is_estimated_cost: boolean;
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
  total_input_cost: number;
  total_output_cost: number;
}

// Streak stats types
export interface StreakStats {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  streak_start_date: string | null;
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

// Session Insights types
export interface SessionInsight {
  id: number;
  session_id: string;
  summary: string | null;
  key_learnings: string[];
  problems_solved: string[];
  code_patterns: string[];
  technologies: string[];
  difficulty: 'easy' | 'medium' | 'hard' | null;
  generated_at: string;
  user_notes: string | null;
}

export interface CreateInsightRequest {
  session_id: string;
  summary?: string;
  key_learnings?: string[];
  problems_solved?: string[];
  code_patterns?: string[];
  technologies?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  user_notes?: string;
}

export interface UpdateInsightNotesRequest {
  notes: string;
}

// Search types
export interface SearchResult {
  session_id: string;
  message_id: number | null;
  content: string;
  snippet: string;
  type: 'message' | 'session_summary' | 'bookmark_note';
  score: number;
  timestamp: string;
  project_name: string | null;
  is_bookmarked: boolean;
}

export interface SearchOptions {
  query: string;
  from?: string;
  to?: string;
  project?: string;
  bookmarkedOnly?: boolean;
  limit?: number;
  offset?: number;
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

export interface OpenCodeSessionCreatedEvent {
  session: {
    id: string;
    path: string;
    directory?: string;
    started_at: number;
  };
}

export interface OpenCodeMessageUpdatedEvent {
  message: {
    id: string;
    sessionID: string;
    role: 'user' | 'assistant';
    parts?: Array<{ type: string; text?: string }>;
    modelID?: string;
    providerID?: string;
    tokens?: {
      input: number;
      output: number;
    };
  };
}
