import type { Context, Next } from 'hono';

export async function requireCustomer(c: Context, next: Next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  if (user.role !== 'customer' && user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ error: 'FORBIDDEN', message: 'Insufficient permissions' }, 403);
  }

  await next();
}

export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return c.json({ error: 'FORBIDDEN', message: 'Admin access required' }, 403);
  }

  await next();
}

export async function requireSuperAdmin(c: Context, next: Next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  if (user.role !== 'super_admin') {
    return c.json({ error: 'FORBIDDEN', message: 'Super admin access required' }, 403);
  }

  await next();
}
