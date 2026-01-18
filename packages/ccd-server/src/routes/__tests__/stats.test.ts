import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { stats } from '../stats';
import { sessions } from '../sessions';
import { messages } from '../messages';
import { db } from '../../db';

describe('Stats Route', () => {
  beforeEach(() => {
    db.exec('DELETE FROM sessions');
    db.exec('DELETE FROM messages');
    db.exec('DELETE FROM daily_stats');
  });

  describe('GET /today', () => {
    it('should return empty stats when no data', async () => {
      const app = new Hono();
      app.route('/stats', stats);

      const res = await app.request('/stats/today');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.stats.session_count).toBe(0);
      expect(json.data.stats.message_count).toBe(0);
      expect(json.data.sessions).toEqual([]);
    });

    it('should return today stats with data', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);
      app.route('/messages', messages);
      app.route('/stats', stats);

      const sessionRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test',
          project_name: 'test-project'
        })
      });
      const sessionJson = await sessionRes.json();

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionJson.data.id,
          type: 'user',
          content: 'test message',
          input_tokens: 100,
          output_tokens: 0
        })
      });

      const res = await app.request('/stats/today');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.stats.session_count).toBe(1);
      expect(json.data.stats.message_count).toBe(1);
      expect(json.data.sessions.length).toBe(1);
    });
  });

  describe('GET /daily', () => {
    it('should return daily stats with date range', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);
      app.route('/messages', messages);
      app.route('/stats', stats);

      const sessionRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test',
          project_name: 'test-project'
        })
      });
      const sessionJson = await sessionRes.json();

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionJson.data.id,
          type: 'user',
          content: 'test message',
          input_tokens: 100,
          output_tokens: 0
        })
      });

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const res = await app.request(`/stats/daily?from=${yesterday}&to=${today}`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should return daily stats with days param', async () => {
      const app = new Hono();
      app.route('/stats', stats);

      const res = await app.request('/stats/daily?days=7');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should filter by project', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);
      app.route('/messages', messages);
      app.route('/stats', stats);

      const session1Res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test',
          project_name: 'project-a'
        })
      });
      const session1Json = await session1Res.json();

      const session2Res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-2',
          transcript_path: '/tmp/test2.json',
          cwd: '/Users/bh/workspaces/test',
          project_name: 'project-b'
        })
      });
      const session2Json = await session2Res.json();

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session1Json.data.id,
          type: 'user',
          content: 'test message',
          input_tokens: 100,
          output_tokens: 0
        })
      });

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session2Json.data.id,
          type: 'user',
          content: 'test message 2',
          input_tokens: 200,
          output_tokens: 0
        })
      });

      const res = await app.request('/stats/daily?project_name=project-a');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });
  });
});
