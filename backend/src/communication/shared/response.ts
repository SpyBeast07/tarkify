import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiSuccessResponse, ApiErrorResponse } from './types.js';

export function success(c: Context, message: string, status: ContentfulStatusCode = 200) {
  const body: ApiSuccessResponse = { success: true, message };
  return c.json(body, status);
}

export function error(c: Context, errorCode: string, message: string, status: ContentfulStatusCode) {
  const body: ApiErrorResponse = { error: errorCode, message };
  return c.json(body, status);
}

export function validationError(c: Context, message: string) {
  return error(c, 'VALIDATION_ERROR', message, 400);
}

export function badRequest(c: Context, message: string) {
  return error(c, 'BAD_REQUEST', message, 400);
}

export function notFound(c: Context, message: string) {
  return error(c, 'NOT_FOUND', message, 404);
}

export function conflict(c: Context, message: string) {
  return error(c, 'CONFLICT', message, 409);
}

export function tooLarge(c: Context, message: string) {
  return error(c, 'PAYLOAD_TOO_LARGE', message, 413);
}

export function rateLimited(c: Context, message: string) {
  return error(c, 'RATE_LIMITED', message, 429);
}

export function internalError(c: Context, message: string) {
  return error(c, 'INTERNAL_ERROR', message, 500);
}
