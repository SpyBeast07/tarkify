import { Hono } from 'hono';
import { submitCareerApplication } from './service.js';
import { success, badRequest } from '../shared/response.js';

const careers = new Hono();

careers.post('/', async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || null;
    const userAgent = c.req.header('user-agent') || null;

    const result = await submitCareerApplication(body, ip, userAgent);

    if (!result.success) {
      return badRequest(c, result.error!);
    }

    return success(c, 'Your application has been received. We will be in touch soon.');
  } catch (err) {
    if (err instanceof SyntaxError) {
      return badRequest(c, 'Invalid JSON in request body');
    }
    throw err;
  }
});

export default careers;
