import { Hono } from 'hono';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as dashboardService from './service.js';

const dashboard = new Hono<AppEnv>();

dashboard.use('*', requireAuth, requireRole('admin'));

dashboard.get('/', async (c) => {
  try {
    const data = await dashboardService.getDashboard();
    return c.json(data);
  } catch (err) {
    console.error('[admin/dashboard] Failed to load dashboard:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load dashboard data', 500);
  }
});

export default dashboard;
