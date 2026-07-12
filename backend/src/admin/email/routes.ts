import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as emailService from './service.js';
import { emailListParamsSchema, testEmailSchema } from './validation.js';

const email = new Hono<AppEnv>();

email.use('*', requireAuth, requireRole('admin'));

function getUser(c: any): { id: string } {
  const user = c.get('user');
  if (!user) throw new Error('User not found in context');
  return user;
}

function clientIp(c: any): string | null {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || null;
}

// ─── Static routes (must precede /:id) ───────────────────────────────────────

email.get('/templates', async (c) => {
  try {
    const templates = await emailService.getTemplates();
    return c.json(templates);
  } catch (err) {
    console.error('[admin/email] Failed to list templates:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list templates', 500);
  }
});

email.get('/provider', async (c) => {
  try {
    const status = await emailService.getProviderStatus();
    return c.json(status);
  } catch (err) {
    console.error('[admin/email] Failed to get provider status:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get provider status', 500);
  }
});

email.get('/history', async (c) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(c.req.query('limit') || 50)));
    const history = await emailService.getHistory(limit);
    return c.json(history);
  } catch (err) {
    console.error('[admin/email] Failed to get history:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get history', 500);
  }
});

email.get('/stats', async (c) => {
  try {
    const stats = await emailService.getStats();
    return c.json(stats);
  } catch (err) {
    console.error('[admin/email] Failed to get stats:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get stats', 500);
  }
});

// ─── List ────────────────────────────────────────────────────────────────────

email.get('/', async (c) => {
  try {
    const query = c.req.query();
    const parsed = emailListParamsSchema.safeParse(query);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const result = await emailService.listEmails(parsed.data);
    return c.json(result);
  } catch (err) {
    console.error('[admin/email] Failed to list emails:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list emails', 500);
  }
});

// ─── Detail ────────────────────────────────────────────────────────────────────

email.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const detail = await emailService.getEmail(id);
    if (!detail) return errorResponse(c, 'NOT_FOUND', 'Email log not found', 404);
    return c.json(detail);
  } catch (err) {
    console.error('[admin/email] Failed to get email:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get email', 500);
  }
});

// ─── Test email ──────────────────────────────────────────────────────────────

email.post('/test', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = testEmailSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const user = getUser(c);
    const result = await emailService.sendTestEmail(
      parsed.data.recipient,
      user.id,
      clientIp(c),
      c.req.header('user-agent'),
    );
    return c.json({ success: true, id: result.id, status: result.status }, 201 as ContentfulStatusCode);
  } catch (err: any) {
    console.error('[admin/email] Failed to send test email:', err);
    return errorResponse(c, 'ACTION_FAILED', err?.message || 'Failed to send test email', 500 as ContentfulStatusCode);
  }
});

// ─── Resend failed email ──────────────────────────────────────────────────────

email.post('/:id/resend', async (c) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);
    const result = await emailService.resendEmail(
      id,
      user.id,
      clientIp(c),
      c.req.header('user-agent'),
    );
    return c.json({ success: true, id: result.id, status: result.status });
  } catch (err: any) {
    console.error('[admin/email] Failed to resend email:', err);
    if (err?.message?.includes('not found')) {
      return errorResponse(c, 'NOT_FOUND', err.message, 404);
    }
    return errorResponse(c, 'ACTION_FAILED', err?.message || 'Failed to resend email', 500 as ContentfulStatusCode);
  }
});

export default email;
