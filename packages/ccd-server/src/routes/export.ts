import { Hono } from 'hono';
import { getSessions, getMessages, getDailyStats, getSessionInsight } from '../db/queries';
import { CostService, type ModelPricing } from '../services/cost-service';
import { db } from '../db';
import type { Session, Message, DailyStats } from '@ccd/types';

const exportRoute = new Hono();

interface ExportData {
  exported_at: string;
  version: string;
  sessions: Array<Session & {
    messages: Message[];
    insight: ReturnType<typeof getSessionInsight> | null;
  }>;
  daily_stats: DailyStats[];
  model_pricing: ModelPricing[];
}

exportRoute.get('/', (c) => {
  const sessions = getSessions({});
  
  const exportData: ExportData = {
    exported_at: new Date().toISOString(),
    version: '0.1.1',
    sessions: sessions.map(session => {
      const messages = getMessages(session.id);
      const insight = getSessionInsight(session.id);
      
      return {
        ...session,
        messages,
        insight
      };
    }),
    daily_stats: getDailyStats({}),
    model_pricing: db.prepare('SELECT * FROM model_pricing').all() as ModelPricing[]
  };

  const filename = `ccd-export-${new Date().toISOString().split('T')[0]}.json`;
  
  c.header('Content-Type', 'application/json');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  
  return c.json(exportData);
});

export { exportRoute as exportRoute };