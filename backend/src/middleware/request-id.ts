/**
 * Request-ID Middleware
 *
 * Attaches a unique identifier to every request so log entries across
 * middleware, services, and error handlers can be correlated.
 * The ID is exposed via the X-Request-Id response header.
 */

import crypto from 'crypto';
import type { Context, Next } from 'hono';

type AppContext = Context<{ Variables: { requestId: string } }>;

export async function requestId(c: AppContext, next: Next) {
  const id = crypto.randomUUID();
  c.set('requestId', id);
  c.res.headers.set('X-Request-Id', id);
  await next();
}
