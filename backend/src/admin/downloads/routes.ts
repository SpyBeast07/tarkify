import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as downloadService from './service.js';
import { downloadListParamsSchema } from './validation.js';

const downloads = new Hono<AppEnv>();

downloads.use('*', requireAuth, requireRole('admin'));

function getUser(c: any): { id: string } {
  const user = c.get('user');
  if (!user) throw new Error('User not found in context');
  return user;
}

downloads.get('/', async (c) => {
  try {
    const query = c.req.query();
    const parsed = downloadListParamsSchema.safeParse(query);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const result = await downloadService.listDownloads(parsed.data);
    return c.json(result);
  } catch (err) {
    console.error('[admin/downloads] Failed to list downloads:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list downloads', 500);
  }
});

downloads.get('/options', async (c) => {
  try {
    const options = await downloadService.getFilterOptions();
    return c.json(options);
  } catch (err) {
    console.error('[admin/downloads] Failed to load options:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load options', 500);
  }
});

downloads.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await downloadService.getDownload(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Download not found', 404);
    }
    return c.json(data);
  } catch (err) {
    console.error('[admin/downloads] Failed to get download:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get download', 500);
  }
});

downloads.get('/:id/history', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await downloadService.getDownloadHistory(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Download not found', 404);
    }
    return c.json(data);
  } catch (err) {
    console.error('[admin/downloads] Failed to get download history:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get download history', 500);
  }
});

downloads.post('/:id/revoke', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    await downloadService.revokeToken(
      id,
      user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[admin/downloads] Failed to revoke token:', err);
    return errorResponse(c, 'ACTION_FAILED', `Failed to revoke token: ${err.message || 'Unknown error'}`, 500 as ContentfulStatusCode);
  }
});

downloads.post('/:id/regenerate', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const result = await downloadService.regenerateToken(
      id,
      user.id,
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
      c.req.header('user-agent'),
    );
    return c.json({ success: true, token: result });
  } catch (err: any) {
    console.error('[admin/downloads] Failed to regenerate token:', err);
    return errorResponse(c, 'ACTION_FAILED', `Failed to regenerate token: ${err.message || 'Unknown error'}`, 500 as ContentfulStatusCode);
  }
});

export default downloads;
