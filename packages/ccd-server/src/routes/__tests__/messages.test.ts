import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { messages } from '../messages';
import { db } from '../../db';
import { createSession } from '../../db/queries';

describe('Messages Route', () => {
  beforeEach(() => {
    db.exec('DELETE FROM sessions');
    db.exec('DELETE FROM messages');
    db.exec('DELETE FROM daily_stats');
  });

  describe('POST /', () => {
    it('should create message with valid data', async () => {
      const app = new Hono();
      app.route('/messages', messages);

      const session = createSession({
        session_id: 'test-session-1',
        transcript_path: '/tmp/test.json',
        cwd: '/Users/bh/workspaces/test'
      });

      const res = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          type: 'user',
          content: 'test message'
        })
      });

      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('user');
      expect(json.data.content).toBe('test message');
    });

    it('should create assistant message', async () => {
      const app = new Hono();
      app.route('/messages', messages);

      const session = createSession({
        session_id: 'test-session-1',
        transcript_path: '/tmp/test.json',
        cwd: '/Users/bh/workspaces/test'
      });

      const res = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          type: 'assistant',
          content: 'test response'
        })
      });

      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.type).toBe('assistant');
    });

    it('should return 400 when missing required fields', async () => {
      const app = new Hono();
      app.route('/messages', messages);

      const res = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-id'
        })
      });

      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid type', async () => {
      const app = new Hono();
      app.route('/messages', messages);

      const session = createSession({
        session_id: 'test-session-1',
        transcript_path: '/tmp/test.json',
        cwd: '/Users/bh/workspaces/test'
      });

      const res = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          type: 'invalid',
          content: 'test message'
        })
      });

      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('type must be "user" or "assistant"');
    });
  });

  describe('GET /:uuid', () => {
    it('should return message by UUID', async () => {
      const app = new Hono();
      app.route('/messages', messages);

      const session = createSession({
        session_id: 'test-session-1',
        transcript_path: '/tmp/test.json',
        cwd: '/Users/bh/workspaces/test'
      });

      const createRes = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          type: 'user',
          content: 'test message'
        })
      });
      const createJson = await createRes.json();

      const res = await app.request(`/messages/${createJson.data.uuid}`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.uuid).toBe(createJson.data.uuid);
    });

    it('should return 404 for non-existent message', async () => {
      const app = new Hono();
      app.route('/messages', messages);

      const res = await app.request('/messages/non-existent-uuid');
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Message not found');
    });
  });
});
