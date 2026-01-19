import { Hono } from 'hono';
import { db } from '../db';
import { ClaudeProvider, type SessionAnalysis } from '../services/ai-insights';
import { successResponse, errorResponse, notFoundResponse } from '../utils/responses';

const aiInsights = new Hono();

const apiKey = process.env.ANTHROPIC_API_KEY;

aiInsights.post('/analyze/:sessionId', async (c) => {
  const { sessionId } = c.req.param();

  try {
    if (!apiKey) {
      return c.json(errorResponse('ANTHROPIC_API_KEY not configured'), 500);
    }

    const session = db.query(
      'SELECT * FROM sessions WHERE id = ?'
    ).get(sessionId);

    if (!session) {
      return c.json(notFoundResponse('Session'), 404);
    }

    const messages = db.query(
      'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC'
    ).all(sessionId);

    if (messages.length === 0) {
      return c.json(errorResponse('No messages found for session'), 400);
    }

    const provider = new ClaudeProvider(apiKey);
    const analysis = await provider.analyze(session, messages);

    const existingInsight = db.query(
      'SELECT id FROM session_insights WHERE session_id = ?'
    ).get(sessionId);

    if (existingInsight) {
      db.prepare(`
        UPDATE session_insights
        SET summary = ?,
            key_learnings = ?,
            problems_solved = ?,
            code_patterns = ?,
            technologies = ?,
            difficulty = ?
        WHERE session_id = ?
      `).run(
        analysis.summary,
        JSON.stringify(analysis.key_learnings),
        JSON.stringify(analysis.problems_solved),
        JSON.stringify(analysis.code_patterns),
        JSON.stringify(analysis.technologies),
        analysis.difficulty,
        sessionId
      );
    } else {
      db.prepare(`
        INSERT INTO session_insights (
          session_id, summary, key_learnings, problems_solved,
          code_patterns, technologies, difficulty
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        analysis.summary,
        JSON.stringify(analysis.key_learnings),
        JSON.stringify(analysis.problems_solved),
        JSON.stringify(analysis.code_patterns),
        JSON.stringify(analysis.technologies),
        analysis.difficulty
      );
    }

    return c.json(successResponse({ data: analysis }));
  } catch (e) {
    console.error('Analysis error:', e);
    return c.json(errorResponse(e instanceof Error ? e.message : 'Analysis failed'), 500);
  }
});

aiInsights.get('/reports', async (c) => {
  try {
    const { type, date } = c.req.query();

    let query = 'SELECT * FROM ai_reports';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (type) {
      conditions.push('report_type = ?');
      params.push(type);
    }

    if (date) {
      conditions.push('report_date = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query = `${query} WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY generated_at DESC';

    const reports = db.query(query).all(...params);

    return c.json(successResponse({
      data: (reports as Record<string, unknown>[]).map(r => ({
        ...r,
        stats_snapshot: r.stats_snapshot ? JSON.parse(r.stats_snapshot as string) : null
      }))
    }));
  } catch (e) {
    console.error('Reports fetch error:', e);
    return c.json(errorResponse('Failed to fetch reports'), 500);
  }
});

aiInsights.post('/reports/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { type = 'daily', date } = body;

    if (!apiKey) {
      return c.json(errorResponse('ANTHROPIC_API_KEY not configured'), 500);
    }

    const reportDate = date || new Date().toISOString().split('T')[0];

    const existing = db.query(
      'SELECT id FROM ai_reports WHERE report_type = ? AND report_date = ?'
    ).get(type, reportDate);

    if (existing) {
      return c.json(errorResponse('Report already exists for this date'), 409);
    }

    const stats = db.query(`
      SELECT
        COUNT(DISTINCT s.id) as session_count,
        COUNT(m.id) as message_count,
        COALESCE(SUM(m.input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(m.output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(m.input_cost), 0) as total_input_cost,
        COALESCE(SUM(m.output_cost), 0) as total_output_cost
      FROM sessions s
      LEFT JOIN messages m ON s.id = m.session_id
      WHERE date(s.started_at) = ?
    `).get(reportDate) as Record<string, unknown>;

    const sessions = db.query(`
      SELECT si.*, s.id as session_id, s.summary
      FROM session_insights si
      JOIN sessions s ON si.session_id = s.id
      WHERE date(s.started_at) = ?
    `).all(reportDate) as Record<string, unknown>[];

    const provider = new ClaudeProvider(apiKey);
    const reportContent = await provider.generateReport({
      type,
      date: reportDate,
      sessions: sessions.map(s => ({
        ...s,
        key_learnings: JSON.parse(s.key_learnings as string || '[]'),
        problems_solved: JSON.parse(s.problems_solved as string || '[]'),
        code_patterns: JSON.parse(s.code_patterns as string || '[]'),
        technologies: JSON.parse(s.technologies as string || '[]'),
        task_type: 'other',
        difficulty: s.difficulty,
        efficiency_score: 75,
        retry_count: 0,
        topic_keywords: []
      })),
      stats,
      patterns: []
    });

    db.prepare(`
      INSERT INTO ai_reports (report_type, report_date, content, stats_snapshot)
      VALUES (?, ?, ?, ?)
    `).run(
      type,
      reportDate,
      reportContent,
      JSON.stringify(stats)
    );

    const report = db.query(
      'SELECT * FROM ai_reports WHERE report_type = ? AND report_date = ?'
    ).get(type, reportDate) as Record<string, unknown>;

    return c.json(successResponse({
      data: {
        ...report,
        stats_snapshot: JSON.parse(report.stats_snapshot as string)
      }
    }));
  } catch (e) {
    console.error('Report generation error:', e);
    return c.json(errorResponse(e instanceof Error ? e.message : 'Report generation failed'), 500);
  }
});

aiInsights.get('/reports/:id', async (c) => {
  const { id } = c.req.param();

  try {
    const report = db.query(
      'SELECT * FROM ai_reports WHERE id = ?'
    ).get(id);

    if (!report) {
      return c.json(notFoundResponse('Report'), 404);
    }

    const reportData = report as Record<string, unknown>;
    return c.json(successResponse({
      data: {
        ...reportData,
        stats_snapshot: reportData.stats_snapshot ? JSON.parse(reportData.stats_snapshot as string) : null
      }
    }));
  } catch (e) {
    console.error('Report fetch error:', e);
    return c.json(errorResponse('Failed to fetch report'), 500);
  }
});

export { aiInsights };
