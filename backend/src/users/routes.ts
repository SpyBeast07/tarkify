import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import * as userService from './service.js';

const users = new Hono();

users.use('*', requireAuth);

users.get('/me', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const result = await userService.getProfile(authUser.id);
  if (!result) {
    return c.json({ error: 'NOT_FOUND', message: 'User not found' }, 404);
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
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON in request body' }, 400);
  }

  try {
    const result = await userService.updateProfile(authUser.id, {
      displayName: body.displayName as string | undefined,
      timezone: body.timezone as string | undefined,
    });

    if (!result) {
      return c.json({ error: 'NOT_FOUND', message: 'User not found' }, 404);
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
      return c.json({ error: 'VALIDATION_ERROR', message: err.message }, 400);
    }
    throw err;
  }
});

users.get('/preferences', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const prefs = await userService.getPreferences(authUser.id);
  if (!prefs) {
    return c.json({ error: 'NOT_FOUND', message: 'User not found' }, 404);
  }

  return c.json({ preferences: prefs });
});

users.put('/preferences', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'BAD_REQUEST', message: 'Invalid JSON in request body' }, 400);
  }

  try {
    const prefs = await userService.updatePreferences(authUser.id, body);
    if (!prefs) {
      return c.json({ error: 'NOT_FOUND', message: 'User not found' }, 404);
    }

    return c.json({ message: 'Preferences updated', preferences: prefs });
  } catch (err) {
    if (err instanceof Error) {
      return c.json({ error: 'VALIDATION_ERROR', message: err.message }, 400);
    }
    throw err;
  }
});

users.get('/touch', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  await userService.touchActivity(authUser.id);
  return c.json({ timestamp: new Date().toISOString() });
});

export default users;
