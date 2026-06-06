/**
 * Centralized configuration — reads and validates environment variables at startup.
 * Fails fast if any required variable is missing.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const config = {
  port: parseInt(optionalEnv('PORT', '3001'), 10),

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  razorpay: {
    keyId: requireEnv('RAZORPAY_KEY_ID'),
    keySecret: requireEnv('RAZORPAY_KEY_SECRET'),
    webhookSecret: requireEnv('RAZORPAY_WEBHOOK_SECRET'),
  },

  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  storagePath: optionalEnv('STORAGE_PATH', './storage'),

  /** Download token TTL in seconds (default: 10 minutes). */
  downloadTokenTtlSeconds: parseInt(
    optionalEnv('DOWNLOAD_TOKEN_TTL_SECONDS', '600'),
    10
  ),
} as const;

