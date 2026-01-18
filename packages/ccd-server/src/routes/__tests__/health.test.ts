import { describe, it, expect } from 'bun:test';
import { Hono } from 'hono';

describe('Health Route', () => {
  it('should return 200 OK', async () => {
    const { health } = await import('../health');
    const app = new Hono();
    app.route('/health', health);

    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('ok');
    expect(json.data.uptime).toBeNumber();
    expect(json.data.version).toBeString();
  });
});
