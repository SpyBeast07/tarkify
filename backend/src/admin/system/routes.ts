import { Hono } from 'hono';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as system from './service.js';
import { systemQuerySchema } from './validation.js';

const app = new Hono<AppEnv>();

app.use('*', requireAuth, requireRole('admin'));

async function handle(
  c: import('hono').Context<AppEnv>,
  fn: () => Promise<unknown>,
): Promise<Response> {
  const parsed = systemQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400);
  }
  try {
    const data = await fn();
    return c.json(data);
  } catch (err) {
    console.error('[admin/system] Failed to load system health:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load system health', 500);
  }
}

app.get('/', (c) => handle(c, () => system.getOverview()));
app.get('/application', (c) => handle(c, () => system.getApplication()));
app.get('/database', (c) => handle(c, () => system.getDatabase()));
app.get('/storage', (c) => handle(c, () => system.getStorage()));
app.get('/email', (c) => handle(c, () => system.getEmail()));
app.get('/payments', (c) => handle(c, () => system.getPayments()));
app.get('/oauth', (c) => handle(c, () => system.getOAuth()));
app.get('/api', (c) => handle(c, () => system.getApi()));
app.get('/disk', (c) => handle(c, () => system.getDisk()));
app.get('/memory', (c) => handle(c, () => system.getMemory()));
app.get('/environment', (c) => handle(c, () => system.getEnvironment()));
app.get('/version', (c) => handle(c, () => system.getVersion()));

export default app;
