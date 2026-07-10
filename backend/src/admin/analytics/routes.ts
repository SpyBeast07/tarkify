import { Hono } from 'hono';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import { recordEvent } from '../../audit/service.js';
import { AUDIT_EVENTS } from '../../audit/types.js';
import * as analytics from './service.js';
import { analyticsQuerySchema, type AnalyticsQuery } from './validation.js';

const app = new Hono<AppEnv>();

app.use('*', requireAuth, requireRole('admin'));

function clientIp(c: import('hono').Context): string | null {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    null
  );
}

async function handle(
  c: import('hono').Context<AppEnv>,
  fn: (q: AnalyticsQuery) => Promise<unknown>,
): Promise<Response> {
  const parsed = analyticsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400);
  }
  try {
    const data = await fn(parsed.data);
    return c.json(data);
  } catch (err) {
    console.error('[admin/analytics] Failed to load analytics:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load analytics data', 500);
  }
}

app.get('/overview', (c) =>
  handle(c, async (q) => {
    const data = await analytics.getOverview(q);
    if (q.range === 'month' && !q.start && !q.end) {
      const user = c.get('user');
      if (user) {
        await recordEvent(user.id, AUDIT_EVENTS.ANALYTICS_VIEWED, {}, clientIp(c), c.req.header('user-agent'));
      }
    }
    return data;
  }),
);

app.get('/revenue', (c) => handle(c, (q) => analytics.getRevenue(q)));
app.get('/orders', (c) => handle(c, (q) => analytics.getOrders(q)));
app.get('/downloads', (c) => handle(c, (q) => analytics.getDownloads(q)));
app.get('/products', (c) => handle(c, (q) => analytics.getProducts(q)));
app.get('/customers', (c) => handle(c, (q) => analytics.getCustomers(q)));
app.get('/emails', (c) => handle(c, (q) => analytics.getEmails(q)));
app.get('/growth', (c) => handle(c, (q) => analytics.getGrowth(q)));
app.get('/traffic', (c) => handle(c, (q) => analytics.getTraffic(q)));

export default app;
