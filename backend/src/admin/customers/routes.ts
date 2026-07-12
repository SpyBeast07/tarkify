import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { errorResponse, type AppEnv } from '../../lib/response.js';
import * as customerService from './service.js';
import { customerListParamsSchema } from './validation.js';

const customers = new Hono<AppEnv>();

customers.use('*', requireAuth, requireRole('admin'));

function getUser(c: any): { id: string } {
  const user = c.get('user');
  if (!user) throw new Error('User not found in context');
  return user;
}

async function handleAdminAction(
  c: any,
  customerId: string,
  action: string,
  actionFn: (customerId: string, adminUserId: string, ip?: string | null, ua?: string | null) => Promise<any>,
): Promise<any> {
  try {
    const user = getUser(c);
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null;
    const ua = c.req.header('user-agent') || null;
    const result = await actionFn(customerId, user.id, ip, ua);
    return c.json({ success: true, ...(result !== undefined ? { result } : {}) });
  } catch (err: any) {
    console.error(`[admin/customers] Failed to ${action} customer:`, err);
    return errorResponse(c, 'ACTION_FAILED', `Failed to ${action} customer: ${err.message || 'Unknown error'}`, 500 as ContentfulStatusCode);
  }
}

customers.get('/', async (c) => {
  try {
    const query = c.req.query();
    const parsed = customerListParamsSchema.safeParse(query);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return errorResponse(c, 'VALIDATION_ERROR', `${first.path.join('.')}: ${first.message}`, 400 as ContentfulStatusCode);
    }
    const result = await customerService.listCustomers(parsed.data);
    return c.json(result);
  } catch (err) {
    console.error('[admin/customers] Failed to list customers:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to list customers', 500);
  }
});

customers.get('/options', async (c) => {
  try {
    const options = await customerService.getFilterOptions();
    return c.json(options);
  } catch (err) {
    console.error('[admin/customers] Failed to load options:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to load options', 500);
  }
});

customers.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await customerService.getCustomer(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Customer not found', 404);
    }
    return c.json(data);
  } catch (err) {
    console.error('[admin/customers] Failed to get customer:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Failed to get customer', 500);
  }
});

customers.post('/:id/suspend', async (c) => {
  const id = c.req.param('id');
  return handleAdminAction(c, id, 'suspend', customerService.suspendCustomer);
});

customers.post('/:id/reactivate', async (c) => {
  const id = c.req.param('id');
  return handleAdminAction(c, id, 'reactivate', customerService.reactivateCustomer);
});

customers.post('/:id/delete', async (c) => {
  const id = c.req.param('id');
  return handleAdminAction(c, id, 'delete', customerService.deleteCustomer);
});

customers.post('/:id/resend-verification', async (c) => {
  const id = c.req.param('id');
  try {
    const data = await customerService.getCustomer(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Customer not found', 404);
    }
    if (data.customer.email_verified) {
      return errorResponse(c, 'ALREADY_VERIFIED', 'Email is already verified', 400 as ContentfulStatusCode);
    }
    return handleAdminAction(c, id, 'resend verification email', (_id, adminId, ip, ua) =>
      customerService.resendVerification(_id, data.customer.email, adminId, ip, ua),
    );
  } catch (err: any) {
    console.error('[admin/customers] Failed to resend verification:', err);
    return errorResponse(c, 'ACTION_FAILED', `Failed to resend verification: ${err.message || 'Unknown error'}`, 500 as ContentfulStatusCode);
  }
});

customers.post('/:id/reset-password', async (c) => {
  const id = c.req.param('id');
  try {
    const data = await customerService.getCustomer(id);
    if (!data) {
      return errorResponse(c, 'NOT_FOUND', 'Customer not found', 404);
    }
    return handleAdminAction(c, id, 'send password reset email', (_id, adminId, ip, ua) =>
      customerService.sendPasswordReset(_id, data.customer.email, adminId, ip, ua),
    );
  } catch (err: any) {
    console.error('[admin/customers] Failed to send password reset:', err);
    return errorResponse(c, 'ACTION_FAILED', `Failed to send password reset: ${err.message || 'Unknown error'}`, 500 as ContentfulStatusCode);
  }
});

customers.post('/:id/revoke-sessions', async (c) => {
  const id = c.req.param('id');
  return handleAdminAction(c, id, 'revoke sessions', customerService.revokeSessions);
});

export default customers;
