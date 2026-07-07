import { Hono } from 'hono';
import type { Context } from 'hono';
import { scrypt } from 'node:crypto';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as userService from './service.js';
import * as userRepository from './repository.js';
import * as auditService from '../audit/service.js';
import { query, withTransaction } from '../db.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

function userError(c: Context, error: string, message: string, status: ContentfulStatusCode) {
  return c.json({ error, message, requestId: (c as any).get('requestId') as string | undefined }, status);
}

const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

function generateKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      SCRYPT_CONFIG.dkLen,
      { N: SCRYPT_CONFIG.N, r: SCRYPT_CONFIG.r, p: SCRYPT_CONFIG.p, maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2 },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) throw new Error('Invalid password hash');
  const targetKey = await generateKey(password, salt);
  return targetKey.toString('hex') === key;
}

const users = new Hono();

users.use('*', requireAuth);

users.get('/me', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return userError(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  const result = await userService.getProfile(authUser.id);
  if (!result) {
    return userError(c, 'NOT_FOUND', 'User not found', 404);
  }

  const { profile } = result;

  return c.json({
    user: {
      ...profile,
      name: authUser.name,
      image: authUser.image,
      emailVerified: authUser.emailVerified,
    },
  });
});

users.put('/me', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return userError(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return userError(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  try {
    const result = await userService.updateProfile(authUser.id, {
      displayName: body.displayName as string | undefined,
      timezone: body.timezone as string | undefined,
    });

    if (!result) {
      return userError(c, 'NOT_FOUND', 'User not found', 404);
    }

    const { profile } = result;

    return c.json({
      message: 'Profile updated',
      user: {
        ...profile,
        name: authUser.name,
        image: authUser.image,
        emailVerified: authUser.emailVerified,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      return userError(c, 'VALIDATION_ERROR', err.message, 400);
    }
    throw err;
  }
});

users.get('/preferences', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return userError(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  const prefs = await userService.getPreferences(authUser.id);
  if (!prefs) {
    return userError(c, 'NOT_FOUND', 'User not found', 404);
  }

  return c.json({ preferences: prefs });
});

users.put('/preferences', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return userError(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return userError(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  try {
    const prefs = await userService.updatePreferences(authUser.id, body);
    if (!prefs) {
      return userError(c, 'NOT_FOUND', 'User not found', 404);
    }

    return c.json({ message: 'Preferences updated', preferences: prefs });
  } catch (err) {
    if (err instanceof Error) {
      return userError(c, 'VALIDATION_ERROR', err.message, 400);
    }
    throw err;
  }
});

users.get('/touch', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return userError(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  await userService.touchActivity(authUser.id);
  return c.json({ timestamp: new Date().toISOString() });
});

users.post('/delete-account', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return userError(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  if (authUser.accountStatus !== 'ACTIVE') {
    return userError(c, 'FORBIDDEN', 'Account is not active', 403);
  }

  let body: { password?: string };
  try {
    body = await c.req.json();
  } catch {
    return userError(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  if (!body.password) {
    return userError(c, 'BAD_REQUEST', 'Password is required', 400);
  }

  try {
    const accountResult = await query<{ password: string }>(
      'SELECT password FROM account WHERE user_id = $1 AND provider_id = $2',
      [authUser.id, 'credential'],
    );

    const storedHash = accountResult.rows[0]?.password;
    if (!storedHash) {
      return userError(c, 'INTERNAL_ERROR', 'No credential account found', 500);
    }

    const passwordValid = await verifyPassword(storedHash, body.password);
    if (!passwordValid) {
      return userError(c, 'INVALID_PASSWORD', 'Current password is incorrect', 403);
    }

    await withTransaction(async (client) => {
      await client.query(
        'UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2',
        ['DELETED', authUser.id],
      );
      await client.query('DELETE FROM session WHERE user_id = $1', [authUser.id]);
    });

    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined;
    const ua = c.req.header('user-agent') ?? undefined;
    await auditService.recordAccountDeleted(authUser.id, ip, ua);

    return c.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Failed to delete account:', err);
    return userError(c, 'INTERNAL_ERROR', 'Failed to delete account', 500);
  }
});

users.post('/reactivate', requireRole('admin', 'super_admin'), async (c) => {
  let body: { userId?: string };
  try {
    body = await c.req.json();
  } catch {
    return userError(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }

  if (!body.userId) {
    return userError(c, 'BAD_REQUEST', 'userId is required', 400);
  }

  const user = await userRepository.getUserById(body.userId);
  if (!user) {
    return userError(c, 'NOT_FOUND', 'User not found', 404);
  }

  if (user.account_status !== 'DELETED') {
    return userError(c, 'BAD_REQUEST', 'Account is not deleted', 400);
  }

  await userRepository.changeAccountStatus(body.userId, 'ACTIVE');

  const adminUser = c.get('user');
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? undefined;
  const ua = c.req.header('user-agent') ?? undefined;
  await auditService.recordAccountReactivated(body.userId, ip, ua, {
    reactivated_by: adminUser?.id,
    reactivated_by_email: adminUser?.email,
  });

  return c.json({ message: 'Account reactivated successfully' });
});

export default users;
