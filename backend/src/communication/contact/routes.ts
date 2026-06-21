import { Hono } from 'hono';
import { submitContact } from './service.js';
import { success, badRequest } from '../shared/response.js';

const contact = new Hono();

contact.post('/', async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || null;
    const userAgent = c.req.header('user-agent') || null;

    const result = await submitContact(body, ip, userAgent);

    if (!result.success) {
      return badRequest(c, result.error!);
    }

    return success(c, 'Thank you for your message. We will get back to you within 24 hours.');
  } catch (err) {
    if (err instanceof SyntaxError) {
      return badRequest(c, 'Invalid JSON in request body');
    }
    throw err;
  }
});

export default contact;
