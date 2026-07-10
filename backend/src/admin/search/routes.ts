import { Hono } from 'hono';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as search from './service.js';
import { searchQuerySchema } from './validation.js';
import type { SearchParams } from './types.js';

const app = new Hono<AppEnv>();

app.use('*', requireAuth, requireRole('admin'));

app.get('/', async (c) => {
  const parsed = searchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400);
  }
  try {
    const result = await search.search(parsed.data as SearchParams);
    return c.json(result);
  } catch (err) {
    console.error('[admin/search] Failed to search:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Search failed', 500);
  }
});

app.get('/options', async (c) => {
  try {
    const options = await search.getOptions();
    return c.json(options);
  } catch (err) {
    console.error('[admin/search] Failed to load options:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load search options', 500);
  }
});

export default app;
