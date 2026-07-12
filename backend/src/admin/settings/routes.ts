import { Hono } from 'hono';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as settings from './service.js';
import { SETTINGS_GROUPS, type SettingsGroup } from './types.js';

const app = new Hono<AppEnv>();

app.use('*', requireAuth, requireRole('admin'));

function clientIp(c: import('hono').Context): string | null {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    null
  );
}

function getUser(c: import('hono').Context<AppEnv>) {
  const user = c.get('user');
  if (!user) throw new Error('User not found in context');
  return user;
}

app.get('/', async (c) => {
  try {
    const data = await settings.getAllSettings();
    return c.json(data);
  } catch (err) {
    console.error('[admin/settings] Failed to load settings:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load settings', 500);
  }
});

for (const group of SETTINGS_GROUPS) {
  app.get(`/${group}`, async (c) => {
    try {
      const data = await settings.getSettings(group);
      return c.json(data);
    } catch (err) {
      console.error(`[admin/settings] Failed to load ${group}:`, err);
      return errorResponse(c, 'INTERNAL_ERROR', `Failed to load ${group} settings`, 500);
    }
  });

  app.put(`/${group}`, async (c) => {
    try {
      const body = await c.req.json().catch(() => null);
      if (body === null) {
        return errorResponse(c, 'VALIDATION_ERROR', 'Request body is required', 400);
      }
      const user = getUser(c);
      const updated = await settings.updateSettings(
        group as SettingsGroup,
        body,
        user.id,
        clientIp(c),
        c.req.header('user-agent'),
      );
      return c.json({ success: true, [group]: updated });
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const first = (err as { issues: { path: (string | number)[]; message: string }[] }).issues[0];
        const path = first?.path?.join('.') ?? '';
        return errorResponse(c, 'VALIDATION_ERROR', `${path}: ${first?.message ?? 'Invalid value'}`, 400);
      }
      console.error(`[admin/settings] Failed to update ${group}:`, err);
      return errorResponse(c, 'INTERNAL_ERROR', `Failed to update ${group} settings`, 500);
    }
  });
}

export default app;
