import { Hono } from 'hono';
import { getTodayStats, getTodaySessions } from '../db/queries';
import type { ApiResponse, TodayStatsResponse } from '@ccd/types';

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

export { stats };
