import { Hono } from 'hono';
import {
  getSessionInsight,
  createOrUpdateInsight,
  updateInsightNotes,
  deleteSessionInsight,
  getRecentInsights,
  type CreateInsightRequest
} from '../db/queries';

const insights = new Hono();

// Get insight for a session
insights.get('/:sessionId', (c) => {
  const sessionId = c.req.param('sessionId');
  const insight = getSessionInsight(sessionId);

  if (!insight) {
    return c.json({ success: false, error: 'Insight not found' }, 404);
  }

  // Parse JSON fields
  const parsed = {
    ...insight,
    key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
    problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
    code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
    technologies: insight.technologies ? JSON.parse(insight.technologies) : []
  };

  return c.json({ success: true, data: parsed });
});

// Create or update insight
insights.post('/', async (c) => {
  try {
    const body = await c.req.json() as CreateInsightRequest;

    if (!body.session_id) {
      return c.json({ success: false, error: 'session_id is required' }, 400);
    }

    const insight = createOrUpdateInsight(body);

    // Parse JSON fields for response
    const parsed = {
      ...insight,
      key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
      problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
      code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
      technologies: insight.technologies ? JSON.parse(insight.technologies) : []
    };

    return c.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error creating/updating insight:', error);
    return c.json({ success: false, error: 'Failed to create/update insight' }, 500);
  }
});

// Update user notes
insights.patch('/:sessionId/notes', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json() as { notes: string };

    updateInsightNotes(sessionId, body.notes);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating notes:', error);
    return c.json({ success: false, error: 'Failed to update notes' }, 500);
  }
});

// Delete insight
insights.delete('/:sessionId', (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    deleteSessionInsight(sessionId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting insight:', error);
    return c.json({ success: false, error: 'Failed to delete insight' }, 500);
  }
});

// Get recent insights
insights.get('/recent/:limit?', (c) => {
  const limit = Number.parseInt(c.req.param('limit') || '10', 10);
  const recentInsights = getRecentInsights(limit);

  // Parse JSON fields
  const parsed = recentInsights.map(insight => ({
    ...insight,
    key_learnings: insight.key_learnings ? JSON.parse(insight.key_learnings) : [],
    problems_solved: insight.problems_solved ? JSON.parse(insight.problems_solved) : [],
    code_patterns: insight.code_patterns ? JSON.parse(insight.code_patterns) : [],
    technologies: insight.technologies ? JSON.parse(insight.technologies) : []
  }));

  return c.json({ success: true, data: parsed });
});

export { insights };
