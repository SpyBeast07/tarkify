import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type AppEnv = { Variables: { requestId: string } };

export function errorResponse(c: Context<AppEnv>, error: string, message: string, status: ContentfulStatusCode) {
  return c.json({
    success: false,
    error,
    message,
    requestId: c.get('requestId'),
  }, status);
}
