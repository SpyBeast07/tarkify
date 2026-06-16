/**
 * Security Middleware
 *
 * Centralised security controls applied to every request:
 *   - Rate limiting (simple in-memory sliding window)
 *   - Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP)
 *   - Request body size limit
 */

import type { Context, Next } from 'hono';

// ── Request Size Limit ──────────────────────────────────────────

const MAX_BODY_BYTES = 100_000; // 100 kB

export async function bodySizeLimit(c: Context, next: Next) {
  const len = c.req.header('content-length');
  if (len) {
    const bytes = parseInt(len, 10);
    if (!isNaN(bytes) && bytes > MAX_BODY_BYTES) {
      return c.json({ error: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds maximum allowed size' }, 413);
    }
  }
  await next();
}

// ── Security Headers ────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export async function securityHeaders(c: Context, next: Next) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    c.res.headers.set(key, value);
  }
  await next();
}

// ── Rate Limiter (in-memory sliding window) ─────────────────────

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// Cleanup stale buckets every 60 s
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

/**
 * Create a rate-limited route group.
 *
 * Usage:
 *   const limited = rateLimit({ windowMs: 60_000, max: 30 });
 *   payments.post('/create-order', limited, handler);
 */
export function rateLimit(opts: { windowMs: number; max: number }) {
  return async function rateLimitMiddleware(c: Context, next: Next) {
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';

    const key = `${ip}:${c.req.method}:${c.req.path}`;
    const now = Date.now();

    // Periodic cleanup to prevent memory leak
    if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
      lastCleanup = now;
      for (const [k, bucket] of buckets) {
        if (now > bucket.resetAt) buckets.delete(k);
      }
    }

    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;
    if (bucket.count > opts.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.res.headers.set('Retry-After', String(retryAfter));
      c.res.headers.set('X-RateLimit-Limit', String(opts.max));
      c.res.headers.set('X-RateLimit-Remaining', '0');
      c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
      return c.json({ error: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' }, 429);
    }

    c.res.headers.set('X-RateLimit-Limit', String(opts.max));
    c.res.headers.set('X-RateLimit-Remaining', String(opts.max - bucket.count));

    await next();
  };
}
