import { Hono } from 'hono';
import { getTodayStats, getTodaySessions, getDailyStats, getStreakStats } from '../db/queries';
import type { ApiResponse, TodayStatsResponse, DailyStats, StreakStats } from '@ccd/types';

const stats = new Hono();

// Get today's statistics
stats.get('/today', (c) => {
  const todayStats = getTodayStats();
  const todaySessions = getTodaySessions();

  const response: ApiResponse<TodayStatsResponse> = {
    success: true,
    data: {
      stats: todayStats,
      sessions: todaySessions
    }
  };

  return c.json(response);
});

// Get daily statistics with date range
stats.get('/daily', (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const days = c.req.query('days');
  const project = c.req.query('project');

  const options: { from?: string; to?: string; days?: number; project?: string } = {};

  if (days) {
    const parsedDays = Number.parseInt(days, 10);
    if (!Number.isNaN(parsedDays) && parsedDays > 0) {
      options.days = parsedDays;
    }
  } else if (from) {
    options.from = from;
    if (to) {
      options.to = to;
    }
  }

  if (project) {
    options.project = project;
  }

  const dailyStats = getDailyStats(options);

  const response: ApiResponse<DailyStats[]> = {
    success: true,
    data: dailyStats
  };

  return c.json(response);
});

// Get coding streak statistics
stats.get('/streak', (c) => {
  const streakStats = getStreakStats();

  const response: ApiResponse<StreakStats> = {
    success: true,
    data: streakStats
  };

  return c.json(response);
});

export { stats };
