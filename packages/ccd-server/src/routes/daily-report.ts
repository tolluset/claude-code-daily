import { Hono } from 'hono';
import {
  getDailyStats,
  getSessions,
  getSessionInsight
} from '../db/queries';
import type { ApiResponse, DailyReportData, SessionInsight, Session } from '@ccd/types';

const dailyReport = new Hono();

dailyReport.get('/', (c) => {
  const dateParam = c.req.query('date');
  const targetDate = dateParam || new Date().toISOString().split('T')[0];

  const stats = getDailyStats({ from: targetDate, to: targetDate });
  const dailyStat = stats[0] || {
    date: targetDate,
    session_count: 0,
    message_count: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_input_cost: 0,
    total_output_cost: 0
  };

  const sessions = getSessions({ date: targetDate });

  const sessionsWithInsights = sessions.map(session => {
    const insight = getSessionInsight(session.id);
    if (insight) {
      const parsedInsight: SessionInsight = {
        ...insight,
        key_learnings: (insight.key_learnings ? JSON.parse(insight.key_learnings) : []) as string[],
        problems_solved: (insight.problems_solved ? JSON.parse(insight.problems_solved) : []) as string[],
        code_patterns: (insight.code_patterns ? JSON.parse(insight.code_patterns) : []) as string[],
        technologies: (insight.technologies ? JSON.parse(insight.technologies) : []) as string[]
      };
      return { ...session, insight: parsedInsight };
    }
    return { ...session, insight: null };
  });

  const bookmarkedCount = sessions.filter(s => s.is_bookmarked).length;
  const projects = [...new Set(sessions.map(s => s.project_name).filter((p): p is string => p !== null))];

  const completedSessions = sessions.filter((s): s is Session & { ended_at: string } => s.ended_at !== null);
  let avgDuration = null;
  if (completedSessions.length > 0) {
    const totalMinutes = completedSessions.reduce((sum, s) => {
      const start = new Date(s.started_at).getTime();
      const end = new Date(s.ended_at).getTime();
      return sum + (end - start) / 1000 / 60;
    }, 0);
    avgDuration = Math.round(totalMinutes / completedSessions.length);
  }

  const response: ApiResponse<DailyReportData> = {
    success: true,
    data: {
      date: targetDate,
      stats: dailyStat,
      sessions: sessionsWithInsights,
      summary: {
        total_sessions: sessions.length,
        total_messages: dailyStat.message_count,
        total_tokens: dailyStat.total_input_tokens + dailyStat.total_output_tokens,
        total_cost: dailyStat.total_input_cost + dailyStat.total_output_cost,
        avg_session_duration: avgDuration,
        bookmarked_count: bookmarkedCount,
        projects
      }
    }
  };

  return c.json(response);
});

export { dailyReport };
