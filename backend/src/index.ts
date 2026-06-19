/**
 * Tarkify Backend — Main Entry Point
 *
 * Initializes the Hono server, mounts route groups,
 * verifies database connectivity, and starts listening.
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors.js';
import { requestId } from './middleware/request-id.js';
import { securityHeaders, bodySizeLimit, rateLimit } from './middleware/security.js';
import { testConnection } from './db.js';
import { config } from './config.js';
import products from './routes/products.js';
import payments from './routes/payments.js';
import webhooks from './routes/webhooks.js';
import downloads from './routes/downloads.js';
import forms from './routes/forms.js';

const app = new Hono<{ Variables: { requestId: string } }>();

// ── Global Middleware (order matters: outermost first) ───────────
app.use('*', requestId);
app.use('*', corsMiddleware);
app.use('*', securityHeaders);
app.use('*', bodySizeLimit);
app.use('*', logger());

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Root / Welcome ───────────────────────────────────────────────
app.get('/', (c) => {
  return c.json({ name: 'Tarkify API', status: 'active', version: '1.0.0' });
});

// ── Rate limiting on the main app with path-prefix matching ─────
// Applied directly to the main app (not sub-apps) to ensure middleware
// is always executed. Sub-app `.use()` middleware was not being triggered
// in Hono, leaving payment/download/webhook endpoints unprotected.
const paymentLimit = rateLimit({ windowMs: 60_000, max: 30 });
const downloadLimit = rateLimit({ windowMs: 60_000, max: 60 });
const webhookLimit = rateLimit({ windowMs: 60_000, max: 20 });

app.use('/api/payments/*', paymentLimit);
app.use('/api/downloads/*', downloadLimit);
app.use('/api/webhooks/*', webhookLimit);

// ── Route Groups ─────────────────────────────────────────────────
app.route('/api/products', products);
app.route('/api/payments', payments);
app.route('/api/webhooks', webhooks);
app.route('/api/downloads', downloads);
app.route('/api/forms', forms);

// ── 404 Fallback ─────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ error: 'NOT_FOUND', message: 'Route not found' }, 404);
});

// ── Global Error Handler ─────────────────────────────────────────
app.onError((err, c) => {
  const rid = c.get('requestId') as string | undefined;
  // Log the full error server-side; never leak internals to the client.
  console.error(`request=${rid ?? 'none'} unhandled_error=${err.message}`);
  return c.json(
    { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: rid },
    500
  );
});

// ── Startup ──────────────────────────────────────────────────────
// Graceful shutdown handler — hoisted so it's available inside start().
async function shutdown(signal: string) {
  console.info(`
Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new requests.
  if (server) {
    server.stop();
    console.info('✓ HTTP server stopped');
  }

  // Close database pool — wait for active queries to finish (max 10s).
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

async function start() {
  try {
    await testConnection();
    console.info('✓ Database connected');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }

  console.info(`✓ Starting server on port ${config.port}`);
  console.info(`✓ Frontend CORS origin: ${config.frontendUrl}`);

  // We create the server explicitly via Bun.serve() so we have a
  // reference to stop during graceful shutdown. The auto-export pattern
  // (export default { fetch }) does not give us a server handle.
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
