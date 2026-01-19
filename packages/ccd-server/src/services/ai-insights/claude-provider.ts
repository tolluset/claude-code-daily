import type {
  LLMProvider,
  Session,
  Message,
  SessionAnalysis,
  Pattern,
  ReportData,
  EfficiencyMetrics
} from './types';

export class ClaudeProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
  }

  async analyze(session: Session, messages: Message[]): Promise<SessionAnalysis> {
    const metrics = this.calculateEfficiencyMetrics(session, messages);

    const prompt = this.buildAnalysisPrompt(session, messages, metrics);

    const response = await this.callLLM(
      `You are a code analysis expert. Analyze the following Claude Code session and extract insights in JSON format.

${prompt}

Respond with JSON only, no markdown or explanations.`
    );

    const result = JSON.parse(response) as Partial<SessionAnalysis>;

    return {
      session_id: session.id,
      summary: result.summary || session.summary || 'Untitled session',
      key_learnings: result.key_learnings || [],
      problems_solved: result.problems_solved || [],
      code_patterns: result.code_patterns || [],
      technologies: result.technologies || [],
      task_type: result.task_type || 'other',
      difficulty: result.difficulty || 'medium',
      efficiency_score: this.calculateEfficiencyScore(metrics),
      retry_count: metrics.retry_messages,
      topic_keywords: result.topic_keywords || []
    };
  }

  async detectPatterns(analyses: SessionAnalysis[]): Promise<Pattern[]> {
    if (analyses.length < 3) return [];

    const prompt = `Analyze the following session analyses and detect patterns:

${JSON.stringify(analyses, null, 2)}

Detect:
1. Repeated topics (appearing 3+ times)
2. Common error patterns
3. Frequent technologies/stack

For each pattern, provide:
- pattern_type: "repeated_topic", "common_error", or "frequent_tech"
- description: Clear description
- suggestion: How to improve or learn more

Respond with JSON array only.`;

    const response = await this.callLLM(prompt);
    const patterns = JSON.parse(response) as Pattern[];

    return patterns.map(p => ({
      ...p,
      occurrences: this.countPatternOccurrences(p, analyses),
      session_ids: this.getRelatedSessionIds(p, analyses)
    }));
  }

  async generateReport(data: ReportData): Promise<string> {
    const prompt = this.buildReportPrompt(data);

    const response = await this.callLLM(prompt);

    return response;
  }

  private async callLLM(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private calculateEfficiencyMetrics(session: Session, messages: Message[]): EfficiencyMetrics {
    const userMessages = messages.filter(m => m.type === 'user');
    const retryKeywords = ['다시', '수정', '에러', 'error', 'fix', 'fix it', 'retry', 'again'];

    const retryMessages = userMessages.filter(m =>
      retryKeywords.some(k => m.content?.toLowerCase().includes(k))
    ).length;

    const fileEdits: Record<string, number> = {};
    messages.forEach(m => {
      const fileMatch = m.content?.match(/([a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|py|go|rs|sql|sh|md))/);
      if (fileMatch) {
        fileEdits[fileMatch[1]] = (fileEdits[fileMatch[1]] || 0) + 1;
      }
    });

    const sameFileEdits = Math.max(...Object.values(fileEdits), 0) - 1;

    const errorMessages = messages.filter(m =>
      m.content?.toLowerCase().includes('error') || m.content?.toLowerCase().includes('exception')
    ).length;

    return {
      turns_to_complete: userMessages.length,
      retry_messages: retryMessages,
      same_file_edits: Math.max(0, sameFileEdits),
      error_recovery_count: errorMessages
    };
  }

  private calculateEfficiencyScore(metrics: EfficiencyMetrics): number {
    let score = 100;

    if (metrics.turns_to_complete > 10) score -= (metrics.turns_to_complete - 10) * 2;

    score -= metrics.retry_messages * 5;

    score -= Math.max(0, metrics.same_file_edits - 2) * 3;

    return Math.max(0, Math.min(100, score));
  }

  private buildAnalysisPrompt(session: Session, messages: Message[], metrics: EfficiencyMetrics): string {
    const messagesPreview = messages.map(m =>
      `[${m.type}]: ${m.content?.slice(0, 300)}...`
    ).join('\n\n');

    return `## Session Information
- Project: ${session.project_name || 'Unknown'}
- Started: ${session.started_at}
- Ended: ${session.ended_at || 'In progress'}
- Source: ${session.source}
- Total Messages: ${messages.length}

## Efficiency Metrics
- Turns to complete: ${metrics.turns_to_complete}
- Retry messages: ${metrics.retry_messages}
- Same file edits: ${metrics.same_file_edits}

## Messages (Preview)
${messagesPreview}

## Analysis Request
Extract the following information:
1. summary: One-line summary (max 100 chars)
2. task_type: One of - bug_fix, feature, refactor, learning, config, docs, other
3. difficulty: easy, medium, or hard
4. key_learnings: Array of max 3 things learned
5. problems_solved: Array of max 3 problems solved
6. code_patterns: Array of max 3 code patterns used
7. technologies: Array of max 5 technologies/frameworks used
8. topic_keywords: Array of max 5 keywords for search (e.g., "typescript", "hooks", "api")

Respond with JSON only.`;
  }

  private buildReportPrompt(data: ReportData): string {
    return `Generate a ${data.type} report for ${data.date}.

## Statistics
- Sessions: ${data.stats.session_count}
- Messages: ${data.stats.message_count}
- Input Tokens: ${data.stats.total_input_tokens}
- Output Tokens: ${data.stats.total_output_tokens}
- Estimated Cost: $${(data.stats.total_input_cost + data.stats.total_output_cost).toFixed(4)}

${data.patterns && data.patterns.length > 0 ? `
## Detected Patterns
${data.patterns.map(p => `- ${p.description} (${p.occurrences} times)`).join('\n')}
` : ''}

## Session Analyses
${data.sessions.slice(0, 5).map(s => `- ${s.summary} (efficiency: ${s.efficiency_score}/100)`).join('\n')}

Generate a well-formatted Markdown report with:
1. Summary statistics
2. Main tasks completed
3. Key learnings
4. Any warnings or patterns detected
5. Suggestions for improvement

Use emojis and clear formatting.`;
  }

  private countPatternOccurrences(pattern: Pattern, analyses: SessionAnalysis[]): number {
    return analyses.filter(a =>
      a.summary?.toLowerCase().includes(pattern.description.toLowerCase()) ||
      a.topic_keywords?.some(k => pattern.description.toLowerCase().includes(k.toLowerCase()))
    ).length;
  }

  private getRelatedSessionIds(pattern: Pattern, analyses: SessionAnalysis[]): string[] {
    return analyses
      .filter(a =>
        a.summary?.toLowerCase().includes(pattern.description.toLowerCase()) ||
        a.topic_keywords?.some(k => pattern.description.toLowerCase().includes(k.toLowerCase()))
      )
      .map(a => a.session_id);
  }
}
