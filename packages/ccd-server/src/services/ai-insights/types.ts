export interface SessionAnalysis {
  session_id: string;

  summary: string;
  key_learnings: string[];
  problems_solved: string[];
  code_patterns: string[];
  technologies: string[];

  task_type: TaskType;
  difficulty: 'easy' | 'medium' | 'hard';
  efficiency_score: number;
  retry_count: number;
  topic_keywords: string[];
}

export type TaskType =
  | 'bug_fix'
  | 'feature'
  | 'refactor'
  | 'learning'
  | 'config'
  | 'docs'
  | 'other';

export interface EfficiencyMetrics {
  turns_to_complete: number;
  retry_messages: number;
  same_file_edits: number;
  error_recovery_count: number;
}

export interface Pattern {
  id?: number;
  pattern_type: 'repeated_topic' | 'common_error' | 'frequent_tech';
  description: string;
  occurrences: number;
  session_ids: string[];
  first_seen: Date;
  last_seen: Date;
  suggestion?: string;
  is_resolved?: boolean;
}

export interface ReportData {
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  sessions: SessionAnalysis[];
  stats: {
    session_count: number;
    message_count: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_input_cost: number;
    total_output_cost: number;
  };
  patterns?: Pattern[];
}

export interface AIReport {
  id?: number;
  report_type: 'daily' | 'weekly' | 'monthly';
  report_date: string;
  content: string;
  stats_snapshot: string;
  generated_at?: Date;
}

export interface LLMProvider {
  analyze(session: Session, messages: Message[]): Promise<SessionAnalysis>;
  detectPatterns(analyses: SessionAnalysis[]): Promise<Pattern[]>;
  generateReport(data: ReportData): Promise<string>;
}

export interface Session {
  id: string;
  transcript_path: string;
  cwd: string;
  project_name?: string;
  git_branch?: string;
  started_at: Date;
  ended_at?: Date;
  summary?: string;
  source: 'claude' | 'opencode';
}

export interface Message {
  id: number;
  session_id: string;
  uuid?: string;
  type: 'user' | 'assistant';
  content?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  timestamp: Date;
}
