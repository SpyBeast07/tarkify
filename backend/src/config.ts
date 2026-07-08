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

function parsePort(raw: string): number {
  const port = parseInt(raw, 10);
  if (isNaN(port) || port < 1024 || port > 65535) {
    throw new Error(`Invalid PORT: ${raw}. Must be between 1024 and 65535.`);
  }
  return port;
}

function parsePositiveInt(raw: string, name: string, max: number): number {
  const val = parseInt(raw, 10);
  if (isNaN(val) || val <= 0 || val > max) {
    throw new Error(`Invalid ${name}: ${raw}. Must be between 1 and ${max}.`);
  }
  return val;
}

export const config = {
  port: parsePort(optionalEnv('PORT', '3001')),

  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  database: {
    url: requireEnv('DATABASE_URL'),
  },

  razorpay: {
    keyId: requireEnv('RAZORPAY_KEY_ID'),
    keySecret: requireEnv('RAZORPAY_KEY_SECRET'),
    webhookSecret: requireEnv('RAZORPAY_WEBHOOK_SECRET'),
  },

  auth: {
    secret: requireEnv('BETTER_AUTH_SECRET'),
    url: requireEnv('BETTER_AUTH_URL'),
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    defaultFrom: optionalEnv('EMAIL_FROM', 'noreply@tarkify.com'),
    adminEmail: requireEnv('ADMIN_EMAIL'),
  },

  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  storagePath: optionalEnv('STORAGE_PATH', './storage'),

  downloadTokenTtlSeconds: parsePositiveInt(
    optionalEnv('DOWNLOAD_TOKEN_TTL_SECONDS', '600'),
    'DOWNLOAD_TOKEN_TTL_SECONDS',
    86400
  ),
};

const isLiveKey = config.razorpay.keyId.startsWith('rzp_live_');
if (isLiveKey && config.nodeEnv !== 'production') {
  console.warn(
    '⚠️  WARNING: Live Razorpay keys detected in non-production environment! ' +
    'Set NODE_ENV=production if this is intentional, or switch to test keys (rzp_test_*).'
  );
}
