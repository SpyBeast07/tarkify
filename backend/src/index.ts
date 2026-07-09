import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import { corsMiddleware } from './middleware/cors.js';
import { requestId } from './middleware/request-id.js';
import { securityHeaders, bodySizeLimit, rateLimit } from './middleware/security.js';
import { sessionMiddleware } from './middleware/auth.js';
import { testConnection, pool } from './db.js';
import { config } from './config.js';
import { initAuth, getAuth } from './auth.js';
import products from './routes/products.js';
import payments from './routes/payments.js';
import webhooks from './routes/webhooks.js';
import downloads from './routes/downloads.js';
import contact from './communication/contact/routes.js';
import feedback from './communication/feedback/routes.js';
import newsletter from './communication/newsletter/routes.js';
import careers from './communication/careers/routes.js';
import users from './users/routes.js';
import account from './account/routes.js';

const app = new Hono<{ Variables: { requestId: string } }>();
let migrationState: { applied: number; ok: boolean } = { applied: 0, ok: false };

// ── Global Middleware (order matters: outermost first) ───────────
app.use('*', requestId);
app.use('*', corsMiddleware);
app.use('*', securityHeaders);
app.use('*', bodySizeLimit);
app.use('*', logger());
app.use('*', sessionMiddleware);

// ── Liveness Check (Uptime) ───────────────────────────────────────
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Readiness Check (Traffic routing & healthcheck) ───────────────
app.get('/api/ready', async (c) => {
  let dbOk = false;
  let dbError: string | null = null;

  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      dbOk = true;
    } finally {
      client.release();
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'Unknown database error';
  }

  const migrationsOk = migrationState.ok;

  if (dbOk && migrationsOk) {
    return c.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      migrations: `applied (${migrationState.applied})`,
    });
  }

  return c.json(
    {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: dbOk ? 'connected' : 'disconnected',
      migrations: migrationsOk ? `applied (${migrationState.applied})` : 'pending',
      dbError,
    },
    503
  );
});

// ── Root / Welcome ───────────────────────────────────────────────
app.get('/', (c) => {
  return c.json({ name: 'Tarkify API', status: 'active', version: '1.0.0' });
});

// ── Rate limiting on the main app with path-prefix matching ─────
// Must be registered BEFORE route handlers and per-route middleware
// so that rate limits protect downstream DB queries (e.g. the sign-in guard).
const paymentLimit = rateLimit({ windowMs: 60_000, max: 30 });
const downloadLimit = rateLimit({ windowMs: 60_000, max: 60 });
const webhookLimit = rateLimit({ windowMs: 60_000, max: 20 });
const contactLimit = rateLimit({ windowMs: 60_000, max: 10 });
const feedbackLimit = rateLimit({ windowMs: 60_000, max: 20 });
const newsletterLimit = rateLimit({ windowMs: 60_000, max: 30 });
const careersLimit = rateLimit({ windowMs: 60_000, max: 10 });
const authLimit = rateLimit({ windowMs: 60_000, max: 10 });
const userLimit = rateLimit({ windowMs: 60_000, max: 60 });
const accountLimit = rateLimit({ windowMs: 60_000, max: 60 });
const cspReportLimit = rateLimit({ windowMs: 60_000, max: 100 });

app.use('/api/payments/*', paymentLimit);
app.use('/api/downloads/*', downloadLimit);
app.use('/api/webhooks/*', webhookLimit);
app.use('/api/contact', contactLimit);
app.use('/api/feedback', feedbackLimit);
app.use('/api/newsletter', newsletterLimit);
app.use('/api/careers', careersLimit);
app.use('/api/auth/*', authLimit);
app.use('/api/users/*', userLimit);
app.use('/api/account/*', accountLimit);
app.use('/api/csp-report', cspReportLimit);

// ── Device-aware sign-in ──────────────────────────────────────────
// Intercept sign-in to extract device info, then deduplicate sessions per device.
app.use('/api/auth/sign-in/email', async (c, next) => {
  if (c.req.method !== 'POST') { await next(); return; }

  let deviceId: string | undefined;
  let deviceName: string | undefined;
  let deviceType: string | undefined;
  let browser: string | undefined;
  let os: string | undefined;

  try {
    const cloned = c.req.raw.clone();
    const body = await cloned.json();
    deviceId = body.deviceId;
    deviceName = body.deviceName;
    deviceType = body.deviceType;
    browser = body.browser;
    os = body.os;

    const email = body?.email as string | undefined;
    if (email) {
      const result = await pool.query('SELECT account_status FROM users WHERE email = $1', [email]);
      const status = result.rows[0]?.account_status;
      if (status && status !== 'ACTIVE') {
        return c.json({ success: false, error: 'FORBIDDEN', message: 'Account is not active', requestId: c.get('requestId') }, 403);
      }
    }
  } catch {
    // Let Better Auth handle malformed bodies
  }

  await next();

  if (!c.res || c.res.status !== 200 || !deviceId) return;

  try {
    const cloned = c.res.clone();
    const data = await cloned.json() as Record<string, any>;
    const userId = data?.user?.id as string | undefined;
    const sessionToken = data?.session?.token as string | undefined;
    if (userId && sessionToken) {
      await pool.query(
        `UPDATE session SET device_id = $1, device_name = $2, device_type = $3, browser = $4, os = $5, last_seen = NOW() WHERE token = $6`,
        [deviceId, deviceName ?? null, deviceType ?? null, browser ?? null, os ?? null, sessionToken],
      );
      await pool.query(
        `DELETE FROM session WHERE user_id = $1 AND device_id = $2 AND token != $3 AND expires_at > NOW()`,
        [userId, deviceId, sessionToken],
      );
    }
  } catch (err) {
    console.error("Failed to update device tracking after sign-in:", err);
  }
});

// ── Device-aware sign-up ──────────────────────────────────────────
// Same deduplication logic for autoSignIn after registration.
app.use('/api/auth/sign-up/email', async (c, next) => {
  if (c.req.method !== 'POST') { await next(); return; }

  let deviceId: string | undefined;
  let deviceName: string | undefined;
  let deviceType: string | undefined;
  let browser: string | undefined;
  let os: string | undefined;

  try {
    const cloned = c.req.raw.clone();
    const body = await cloned.json();
    deviceId = body.deviceId;
    deviceName = body.deviceName;
    deviceType = body.deviceType;
    browser = body.browser;
    os = body.os;
  } catch {}

  await next();

  if (!c.res || c.res.status !== 200 || !deviceId) return;

  try {
    const cloned = c.res.clone();
    const data = await cloned.json() as Record<string, any>;
    const userId = data?.user?.id as string | undefined;
    const sessionToken = data?.session?.token as string | undefined;
    if (userId && sessionToken) {
      await pool.query(
        `UPDATE session SET device_id = $1, device_name = $2, device_type = $3, browser = $4, os = $5, last_seen = NOW() WHERE token = $6`,
        [deviceId, deviceName ?? null, deviceType ?? null, browser ?? null, os ?? null, sessionToken],
      );
      await pool.query(
        `DELETE FROM session WHERE user_id = $1 AND device_id = $2 AND token != $3 AND expires_at > NOW()`,
        [userId, deviceId, sessionToken],
      );
    }
  } catch (err) {
    console.error("Failed to update device tracking after sign-up:", err);
  }
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return getAuth().handler(c.req.raw);
});

// ── Route Groups ─────────────────────────────────────────────────
app.route('/api/products', products);
app.route('/api/payments', payments);
app.route('/api/webhooks', webhooks);
app.route('/api/downloads', downloads);
app.route('/api/contact', contact);
app.route('/api/feedback', feedback);
app.route('/api/newsletter', newsletter);
app.route('/api/careers', careers);
app.route('/api/users', users);
app.route('/api/account', account);

// ── Email Preview Dashboard ──────────────────────────────────────
app.get('/api/email-previews', async (c) => {
  const { renderPreviewDashboard } = await import('./email/preview.js');
  return c.html(renderPreviewDashboard());
});

app.get('/api/email-previews/:filename', async (c) => {
  const { renderPreviewPage } = await import('./email/preview.js');
  const filename = c.req.param('filename');
  const html = renderPreviewPage(filename);
  if (!html)       return c.json({ success: false, error: 'NOT_FOUND', message: `Unknown template: ${filename}` }, 404);
  return c.html(html);
});

// ── Email Test Route (manual verification) ───────────────────────
app.post('/api/test-email', async (c) => {
  try {
    const { email } = await c.req.json() as { email?: string };
    if (!email) {
      return c.json({ success: false, error: 'VALIDATION_ERROR', message: 'email is required', requestId: c.get('requestId') }, 400);
    }

    const { emailService } = await import('./email/index.js');
    const result = await emailService.sendTestEmail(email);

    return c.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[test-email] Failed: ${message}`);
    return c.json({
      success: false,
      error: 'EMAIL_ERROR',
      message,
      requestId: c.get('requestId'),
    }, 500);
  }
});

// ── CSP Violation Report Receiver ───────────────────────────────
app.post('/api/csp-report', async (c) => {
  try {
    const report = await c.req.json();
    const blocked = report?.['csp-report']?.blocked_uri
      ?? report?.['body']?.blockedURL
      ?? 'unknown';
    const directive = report?.['csp-report']?.violated_directive
      ?? report?.['body']?.effectiveDirective
      ?? 'unknown';
    const documentUri = report?.['csp-report']?.document_uri
      ?? report?.['body']?.documentURL
      ?? 'unknown';
    console.warn(
      `[CSP] Blocked: ${blocked} | Directive: ${directive} | Document: ${documentUri}`
    );
  } catch {
    // Ignore malformed reports
  }
  return c.body(null, 204);
});

// ── 404 Fallback ─────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ success: false, error: 'NOT_FOUND', message: 'Route not found', requestId: c.get('requestId') }, 404);
});

// ── Global Error Handler ─────────────────────────────────────────
app.onError((err, c) => {
  const rid = c.get('requestId') as string | undefined;
  console.error(`request=${rid ?? 'none'} unhandled_error=${err.message}`);
  return c.json(
    { success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: rid },
    500
  );
});

// ── Startup ──────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.info(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.stop();
    console.info('✓ HTTP server stopped');
  }

  const { pool } = await import('./db.js');
  try {
    await Promise.race([
      pool.end(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('pool.end timeout')), 10_000)),
    ]);
    console.info('✓ Database pool closed');
  } catch (err) {
    console.error('Failed to close database pool gracefully:', err);
  }

  console.info('✓ Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

let server: { stop: () => void } | null = null;

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, '../package.json'), 'utf8')) as Record<string, unknown>;
    return String(pkg.version ?? '0.0.0');
  } catch {
    return '0.0.0';
  }
}

async function start() {
  const version = getVersion();
  console.info(`Starting Tarkify backend v${version}...`);

  try {
    await testConnection();
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }

  try {
    initAuth();
    console.info('✓ Better Auth initialized');
  } catch (error) {
    console.error('✗ Failed to initialize Better Auth:', error);
    process.exit(1);
  }

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM _migrations');
    const count = parseInt(result.rows[0]?.count ?? '0', 10);
    migrationState = { applied: count, ok: true };
    console.info(`✓ ${count} migration(s) applied`);
  } catch {
    migrationState = { applied: 0, ok: false };
    console.warn('⚠ Could not query migration state (migrations may not have run)');
  }

  try {
    const { accessSync, constants } = await import('fs');
    accessSync(config.storagePath, constants.R_OK | constants.W_OK);
    console.info(`✓ Storage validated: ${config.storagePath}`);
  } catch {
    console.error(`✗ Storage directory is not accessible: ${config.storagePath}. Check that the directory exists and is writable.`);
    process.exit(1);
  }

  try {
    server = Bun.serve({
      port: config.port,
      fetch: app.fetch,
    });
    console.info(`✓ Server listening on http://0.0.0.0:${config.port}`);
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Named export for test imports. Do NOT change to `export default` —
// Bun auto-starts a server when the entrypoint exports a default with a
// `.fetch` property, which conflicts with our explicit Bun.serve() call.
export { app };
