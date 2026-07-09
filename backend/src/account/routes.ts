import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { errorResponse } from '../lib/response.js';
import * as accountService from './service.js';
import * as purchaseService from '../services/purchase.service.js';
import * as userService from '../users/service.js';
import { getAuth } from '../auth.js';

const account = new Hono();

account.use('*', requireAuth);

account.get('/dashboard', async (c) => {
  const user = c.get('user')!;

  const data = await accountService.getDashboard(user.id);

  return c.json({
    summary: {
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },
    totalPurchases: data.totalPurchases,
    activeDownloads: data.activeDownloads,
    recentActivity: data.recentActivity,
    accountStatus: user.accountStatus,
    memberSince: user.createdAt,
  });
});

account.get('/purchases', async (c) => {
  const user = c.get('user')!;

  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));

  const result = await accountService.getUserPurchases(user.id, page, limit);
  return c.json(result);
});

account.get('/purchases/:id', async (c) => {
  const user = c.get('user')!;

  const purchaseId = c.req.param('id');

  const purchase = await accountService.getUserPurchaseById(user.id, purchaseId);
  if (!purchase) {
    return errorResponse(c, 'NOT_FOUND', 'Purchase not found', 404);
  }

  return c.json({ purchase });
});

account.get('/downloads', async (c) => {
  const user = c.get('user')!;

  const downloads = await accountService.getUserDownloads(user.id);
  return c.json({ downloads });
});

account.post('/downloads/:purchaseId', async (c) => {
  const user = c.get('user')!;

  const purchaseId = c.req.param('purchaseId');

  const purchase = await accountService.getUserPurchaseById(user.id, purchaseId);
  if (!purchase) {
    return errorResponse(c, 'NOT_FOUND', 'Purchase not found', 404);
  }

  if (purchase.status !== 'paid') {
    return errorResponse(c, 'FORBIDDEN', 'Purchase is not completed', 403);
  }

  const existing = await purchaseService.validateActiveTokenByPurchase(purchaseId);
  const tokenRecord = existing ?? await purchaseService.generateDownloadToken(purchaseId, purchase.product_id);

  const productSlug = purchase.product_slug;
  const downloadUrl = `/api/downloads/${productSlug}?token=${tokenRecord.token}`;

  return c.json({
    token: tokenRecord.token,
    expiresAt: tokenRecord.expires_at,
    downloadUrl,
  });
});

account.get('/billing', async (c) => {
  const user = c.get('user')!;

  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));

  const result = await accountService.getBillingHistory(user.id, page, limit);
  return c.json(result);
});

account.get('/profile', async (c) => {
  const user = c.get('user')!;

  const result = await userService.getProfile(user.id);
  if (!result) {
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        name: user.name,
        image: user.image,
        role: user.role,
        timezone: user.timezone,
        preferences: {},
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        lastActivityAt: user.lastActivityAt,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  }

  const { profile } = result;
  return c.json({
    user: {
      ...profile,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
    },
  });
});

account.put('/profile', async (c) => {
  const user = c.get('user')!;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  try {
    const result = await userService.updateProfile(user.id, {
      displayName: body.displayName as string | undefined,
      timezone: body.timezone as string | undefined,
    });

    if (!result) {
      return c.json({
        message: 'Profile created',
        user: {
          id: user.id,
          email: user.email,
          displayName: body.displayName as string | null ?? null,
          name: user.name,
          image: user.image,
          role: user.role,
          timezone: body.timezone as string | null ?? null,
          preferences: {},
          accountStatus: user.accountStatus,
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
          lastActivityAt: user.lastActivityAt,
          createdAt: user.createdAt.toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const { profile } = result;

    return c.json({
      message: 'Profile updated',
      user: {
        ...profile,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      return errorResponse(c, 'VALIDATION_ERROR', err.message, 400);
    }
    throw err;
  }
});

account.get('/has-password', async (c) => {
  const user = c.get('user')!;
  const result = await accountService.hasPassword(user.id);
  return c.json({ hasPassword: result });
});

account.post('/set-password', async (c) => {
  let body: { newPassword?: string };
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  const password = body.newPassword;
  if (!password || password.length < 8) {
    return errorResponse(c, 'VALIDATION_ERROR', 'Password must be at least 8 characters', 400);
  }

  try {
    const auth = getAuth();
    await auth.api.setPassword({
      body: { newPassword: password },
      headers: c.req.raw.headers,
    });
    return c.json({ status: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('PASSWORD_ALREADY_SET')) {
      return errorResponse(c, 'CONFLICT', 'Password already set. Use "Change Password" instead.', 409);
    }
    return errorResponse(c, 'INTERNAL_ERROR', msg, 500);
  }
});

account.get('/preferences', async (c) => {
  const user = c.get('user')!;

  const prefs = await userService.getPreferences(user.id);
  return c.json({ preferences: prefs ?? {} });
});

account.put('/preferences', async (c) => {
  const user = c.get('user')!;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  try {
    const prefs = await userService.updatePreferences(user.id, body);
    return c.json({ message: 'Preferences updated', preferences: prefs ?? {} });
  } catch (err) {
    if (err instanceof Error) {
      return errorResponse(c, 'VALIDATION_ERROR', err.message, 400);
    }
    throw err;
  }
});

export default account;
