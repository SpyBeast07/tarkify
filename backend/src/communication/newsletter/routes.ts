import { Hono } from 'hono';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from './service.js';
import { success, badRequest } from '../shared/response.js';

const newsletter = new Hono();

newsletter.post('/', async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || null;
    const userAgent = c.req.header('user-agent') || null;

    const result = await subscribeToNewsletter(body, ip, userAgent);

    if (!result.success) {
      return badRequest(c, result.error!);
    }

    if (result.alreadySubscribed) {
      return success(c, 'You are already subscribed to our newsletter!');
    }

    return success(c, 'Thank you for subscribing to our newsletter!');
  } catch (err) {
    if (err instanceof SyntaxError) {
      return badRequest(c, 'Invalid JSON in request body');
    }
    throw err;
  }
});

newsletter.post('/unsubscribe', async (c) => {
  try {
    const body = await c.req.json<{ email: string }>();
    const { email } = body;

    if (!email) {
      return badRequest(c, 'Email is required');
    }

    const result = await unsubscribeFromNewsletter(email);

    if (result.wasSubscribed) {
      return success(c, 'You have been unsubscribed from our newsletter.');
    }

    return success(c, 'This email is not subscribed to our newsletter.');
  } catch (err) {
    if (err instanceof SyntaxError) {
      return badRequest(c, 'Invalid JSON in request body');
    }
    throw err;
  }
});

newsletter.get('/unsubscribe', async (c) => {
  const email = c.req.query('email');

  if (!email) {
    return badRequest(c, 'Email is required');
  }

  const result = await unsubscribeFromNewsletter(email);

  if (result.wasSubscribed) {
    return success(c, 'You have been unsubscribed from our newsletter.');
  }

  return success(c, 'This email is not subscribed to our newsletter.');
});

export default newsletter;
