import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function errorResponse(c: Context, error: string, message: string, status: ContentfulStatusCode) {
  return c.json({
    error,
    message,
    requestId: (c as any).get('requestId') as string | undefined,
  }, status);
}
