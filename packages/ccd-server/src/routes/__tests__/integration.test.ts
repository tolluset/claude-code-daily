import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { sessions } from '../sessions';
import { messages } from '../messages';
import { stats } from '../stats';
import { db } from '../../db';

describe('API Integration Tests', () => {
  let app: Hono;

  beforeEach(() => {
    db.exec('DELETE FROM sessions');
    db.exec('DELETE FROM messages');
    db.exec('DELETE FROM daily_stats');

    app = new Hono();
    app.route('/sessions', sessions);
    app.route('/messages', messages);
    app.route('/stats', stats);
  });

  describe('Complete Session Flow', () => {
    it('should create session, add messages, end session, and check stats', async () => {
      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'integration-session-1',
          transcript_path: '/tmp/integration-test.json',
          cwd: '/Users/bh/workspaces/integration-test',
          project_name: 'test-project',
          git_branch: 'main'
        })
      });

      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      expect(createJson.success).toBe(true);
      const sessionId = createJson.data.id;

      const userMessage1 = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          type: 'user',
          content: 'Create a test component',
          input_tokens: 150,
          output_tokens: 0
        })
      });

      expect(userMessage1.status).toBe(201);

      const assistantMessage = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          type: 'assistant',
          content: 'I will create a React component for you',
          model: 'claude-3-5-sonnet',
          input_tokens: 0,
          output_tokens: 200
        })
      });

      expect(assistantMessage.status).toBe(201);

      const userMessage2 = await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          type: 'user',
          content: 'Add error handling',
          input_tokens: 100,
          output_tokens: 0
        })
      });

      expect(userMessage2.status).toBe(201);

      const messagesRes = await app.request(`/sessions/${sessionId}/messages`);
      expect(messagesRes.status).toBe(200);
      const messagesJson = await messagesRes.json();
      expect(messagesJson.success).toBe(true);
      expect(messagesJson.data.length).toBe(3);

      const endRes = await app.request(`/sessions/${sessionId}/end`, {
        method: 'POST'
      });

      expect(endRes.status).toBe(200);
      const endJson = await endRes.json();
      expect(endJson.success).toBe(true);
      expect(endJson.data.ended_at).not.toBeNull();

      const statsRes = await app.request('/stats/today');
      expect(statsRes.status).toBe(200);
      const statsJson = await statsRes.json();
      expect(statsJson.success).toBe(true);
      expect(statsJson.data.stats.session_count).toBe(1);
      expect(statsJson.data.stats.message_count).toBe(3);
      expect(statsJson.data.stats.total_input_tokens).toBe(250);
      expect(statsJson.data.stats.total_output_tokens).toBe(200);
    });
  });

  describe('Multi-Session Scenario', () => {
    it('should handle multiple sessions with filtering', async () => {
      const session1Res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'multi-session-1',
          transcript_path: '/tmp/multi1.json',
          cwd: '/Users/bh/workspaces/project-a',
          project_name: 'project-a'
        })
      });

      const session1Json = await session1Res.json();

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session1Json.data.id,
          type: 'user',
          content: 'Project A task',
          input_tokens: 100,
          output_tokens: 0
        })
      });

      await app.request(`/sessions/${session1Json.data.id}/end`, { method: 'POST' });

      const session2Res = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'multi-session-2',
          transcript_path: '/tmp/multi2.json',
          cwd: '/Users/bh/workspaces/project-b',
          project_name: 'project-b'
        })
      });

      const session2Json = await session2Res.json();

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session2Json.data.id,
          type: 'user',
          content: 'Project B task',
          input_tokens: 150,
          output_tokens: 0
        })
      });

      const allSessionsRes = await app.request('/sessions');
      const allSessionsJson = await allSessionsRes.json();
      expect(allSessionsJson.data.sessions.length).toBe(2);

      const projectAFilterRes = await app.request('/sessions?project=project-a');
      const projectAJson = await projectAFilterRes.json();
      expect(projectAJson.data.sessions.length).toBe(1);

      const dailyStatsRes = await app.request('/stats/daily?days=1');
      const dailyStatsJson = await dailyStatsRes.json();
      expect(dailyStatsJson.data.length).toBeGreaterThanOrEqual(1);

      const projectStatsRes = await app.request('/stats/daily?project=project-a');
      const projectStatsJson = await projectStatsRes.json();
      expect(Array.isArray(projectStatsJson.data)).toBe(true);
    });
  });

  describe('Bookmark Flow', () => {
    it('should toggle bookmark with note and verify', async () => {
      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'bookmark-session',
          transcript_path: '/tmp/bookmark.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });

      const createJson = await createRes.json();
      const sessionId = createJson.data.id;

      const bookmarkRes = await app.request(`/sessions/${sessionId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Important session about refactoring' })
      });

      expect(bookmarkRes.status).toBe(200);
      const bookmarkJson = await bookmarkRes.json();
      expect(bookmarkJson.data.is_bookmarked).toBe(1);
      expect(bookmarkJson.data.bookmark_note).toBe('Important session about refactoring');

      const sessionDetailRes = await app.request(`/sessions/${sessionId}`);
      const sessionDetailJson = await sessionDetailRes.json();
      expect(sessionDetailJson.data.is_bookmarked).toBe(1);
      expect(sessionDetailJson.data.bookmark_note).toBe('Important session about refactoring');

      const sessionsListRes = await app.request('/sessions');
      const sessionsListJson = await sessionsListRes.json();
      expect(sessionsListJson.data.sessions.length).toBe(1);
      expect(sessionsListJson.data.sessions[0].is_bookmarked).toBe(1);
    });
  });

  describe('Delete Cascade', () => {
    it('should delete session and cascade delete messages', async () => {
      const createRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'delete-session',
          transcript_path: '/tmp/delete.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });

      const createJson = await createRes.json();
      const sessionId = createJson.data.id;

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          type: 'user',
          content: 'This will be deleted'
        })
      });

      await app.request('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          type: 'assistant',
          content: 'This too'
        })
      });

      const messagesBeforeDelete = await app.request(`/sessions/${sessionId}/messages`);
      const messagesBeforeJson = await messagesBeforeDelete.json();
      expect(messagesBeforeJson.data.length).toBe(2);

      const deleteRes = await app.request(`/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      expect(deleteRes.status).toBe(200);

      const getRes = await app.request(`/sessions/${sessionId}`);
      expect(getRes.status).toBe(404);

      const allSessionsRes = await app.request('/sessions');
      const allSessionsJson = await allSessionsRes.json();
      expect(allSessionsJson.data.sessions.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message UUID gracefully', async () => {
      const res = await app.request('/messages/invalid-uuid');
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Message not found');
    });

    it('should handle missing session gracefully', async () => {
      const res = await app.request('/sessions/999');
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Session not found');
    });

    it('should handle duplicate session creation gracefully', async () => {
      await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'duplicate-session',
          transcript_path: '/tmp/duplicate.json',
          cwd: '/Users/bh/workspaces/test'
        })
      });

      const duplicateRes = await app.request('/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'duplicate-session',
          transcript_path: '/tmp/duplicate-updated.json',
          cwd: '/Users/bh/workspaces/test-updated'
        })
      });

      expect(duplicateRes.status).toBe(201);
      const duplicateJson = await duplicateRes.json();
      expect(duplicateJson.data.transcript_path).toBe('/tmp/duplicate-updated.json');
    });
  });
});
