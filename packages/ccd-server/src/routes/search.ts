import { Hono } from 'hono';
import { searchSessions } from '../db/queries';
import type { ApiResponse, SearchResult } from '@ccd/types';

const search = new Hono();

search.get('/', (c) => {
  const query = c.req.query('q');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const project = c.req.query('project');
  const bookmarkedOnly = c.req.query('bookmarked') === 'true';
  const limit = c.req.query('limit');
  const offset = c.req.query('offset');

  if (!query || query.trim().length === 0) {
    return c.json<ApiResponse<SearchResult[]>>({
      success: false,
      error: 'Search query is required'
    }, 400);
  }

  const results = searchSessions({
    query: query.trim(),
    from: from || undefined,
    to: to || undefined,
    project: project || undefined,
    bookmarkedOnly,
    limit: limit ? parseInt(limit, 10) : 20,
    offset: offset ? parseInt(offset, 10) : 0
  });

  return c.json<ApiResponse<SearchResult[]>>({
    success: true,
    data: results
  });
});

export { search };
