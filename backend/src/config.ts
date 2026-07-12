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

const env = (name: string) => process.env[name] ?? '';

export const config = {
  port: parsePort(optionalEnv('PORT', '3001')),

  nodeEnv: optionalEnv('NODE_ENV', 'production'),

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
    googleClientId: env('GOOGLE_CLIENT_ID'),
    googleClientSecret: env('GOOGLE_CLIENT_SECRET'),
  },

  googleOAuthEnabled: Boolean(env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET')),

  email: {
    provider: optionalEnv('EMAIL_PROVIDER', 'resend') as 'resend',
    resendApiKey: env('RESEND_API_KEY'),
    fromEmail: optionalEnv('FROM_EMAIL', 'noreply@tarkify.qzz.io'),
    replyToEmail: optionalEnv('REPLY_TO_EMAIL', 'support@tarkify.qzz.io'),
    adminEmail: requireEnv('ADMIN_EMAIL'),
  },

  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:5173'),

  storagePath: optionalEnv('STORAGE_PATH', './storage'),

  downloadTokenTtlSeconds: parsePositiveInt(
    optionalEnv('DOWNLOAD_TOKEN_TTL_SECONDS', '600'),
    'DOWNLOAD_TOKEN_TTL_SECONDS',
    86400
  ),

  admin: {
    name: optionalEnv('ADMIN_NAME', 'Administrator'),
    email: requireEnv('ADMIN_EMAIL'),
    password: requireEnv('ADMIN_PASSWORD'),
  },
};

const isProduction = config.nodeEnv === 'production';

// ── Production Configuration Validation ─────────────────────────

if (isProduction) {
  const errors: string[] = [];

  const urls: Array<{ name: string; value: string }> = [
    { name: 'BETTER_AUTH_URL', value: config.auth.url },
    { name: 'FRONTEND_URL', value: config.frontendUrl },
  ];

  for (const { name, value } of urls) {
    if (!value.startsWith('https://')) {
      errors.push(`${name} must use HTTPS in production (got: ${value})`);
    }
  }

  if (!config.email.resendApiKey) {
    errors.push('RESEND_API_KEY is required in production');
  }

  if (config.auth.secret.length < 32) {
    errors.push('BETTER_AUTH_SECRET must be at least 32 characters in production');
  }

  if (errors.length > 0) {
    console.error('\n✗ Invalid production configuration:');
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    console.error();
    process.exit(1);
  }
}

// ── Razorpay Key Environment Warning ────────────────────────────

const isLiveKey = config.razorpay.keyId.startsWith('rzp_live_');
if (isLiveKey && !isProduction) {
  console.warn(
    '⚠  WARNING: Live Razorpay keys detected in non-production environment!\n' +
    '  Set NODE_ENV=production if this is intentional, or switch to test keys (rzp_test_*).'
  );
}

// ── Google OAuth Validation ─────────────────────────────────────

const hasGoogleId = Boolean(env('GOOGLE_CLIENT_ID'));
const hasGoogleSecret = Boolean(env('GOOGLE_CLIENT_SECRET'));
const hasGoogleOAuth = hasGoogleId && hasGoogleSecret;

if (hasGoogleId !== hasGoogleSecret) {
  const missing = hasGoogleId ? 'GOOGLE_CLIENT_SECRET' : 'GOOGLE_CLIENT_ID';
  throw new Error(
    `Google OAuth is partially configured. ${missing} is missing. ` +
    'Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or omit both to disable Google sign-in.'
  );
}

// ── Startup Summary ─────────────────────────────────────────────

console.info(`  Database:       ${config.database.url.replace(/:.+@/, ':****@')}`);
console.info(`  Better Auth:    ${config.auth.url}  (OAuth: ${hasGoogleOAuth ? '✓' : '○'})`);
console.info(`  Frontend:       ${config.frontendUrl}`);
console.info(`  Email:          ${config.email.fromEmail}${isProduction && !config.email.resendApiKey ? '  ⚠ RESEND_API_KEY not set' : ''}`);
console.info(`  Storage:        ${config.storagePath}`);
console.info(`  Download TTL:   ${config.downloadTokenTtlSeconds}s`);
