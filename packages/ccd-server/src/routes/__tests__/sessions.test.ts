import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { sessions } from '../sessions';
import { db } from '../../db';

describe('Sessions Route', () => {
  beforeEach(() => {
    db.exec('DELETE FROM sessions');
    db.exec('DELETE FROM messages');
    db.exec('DELETE FROM daily_stats');
  });

  describe('GET /', () => {
    it('should return empty array when no sessions', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const res = await app.request('/sessions');
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.sessions).toEqual([]);
      expect(json.data.total).toBe(0);
    });

    it('should return 400 when missing required fields', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1'
        })
      });

      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Missing required fields');
    });
  });

  describe('GET /:id', () => {
    it('should return session details', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });
      const createJson = await createRes.json();

      const res = await app.request(`/sessions/${createJson.data.id}`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('test-session-1');
    });

    it('should return 404 for non-existent session', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const res = await app.request('/sessions/999');
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Session not found');
    });
  });

  describe('POST /:id/end', () => {
    it('should end session', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });
      const createJson = await createRes.json();

      const res = await app.request(`/sessions/${createJson.data.id}/end`, {
        method: 'POST'
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.ended_at).not.toBeNull();
    });

    it('should return 404 for non-existent session', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const res = await app.request('/sessions/999/end', {
        method: 'POST'
      });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /:id/bookmark', () => {
    it('should toggle bookmark', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });
      const createJson = await createRes.json();

      const res = await app.request(`/sessions/${createJson.data.id}/bookmark`, {
        method: 'POST'
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.is_bookmarked).toBe(1);
    });

    it('should support bookmark with note', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });
      const createJson = await createRes.json();

      const res = await app.request(`/sessions/${createJson.data.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Important session' })
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.bookmark_note).toBe('Important session');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete session', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-1',
          transcript_path: '/tmp/test.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });
      const createJson = await createRes.json();

      const res = await app.request(`/sessions/${createJson.data.id}`, {
        method: 'DELETE'
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const app = new Hono();
      app.route('/sessions', sessions);

      const res = await app.request('/sessions/999', {
        method: 'DELETE'
      });
      expect(res.status).toBe(404);
    });
  });
});
