/**
 * Tarkify Backend — Main Entry Point
 *
 * Initializes the Hono server, mounts route groups,
 * verifies database connectivity, and starts listening.
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors.js';
import { testConnection } from './db.js';
import { config } from './config.js';
import products from './routes/products.js';
import payments from './routes/payments.js';
import webhooks from './routes/webhooks.js';
import downloads from './routes/downloads.js';

const app = new Hono();

// ── Global Middleware ────────────────────────────────────────────
app.use('*', corsMiddleware);
app.use('*', logger());

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Root / Welcome ───────────────────────────────────────────────
app.get('/', (c) => {
  return c.json({ name: 'Tarkify API', status: 'active', version: '1.0.0' });
});

// ── Route Groups ─────────────────────────────────────────────────
app.route('/api/products', products);
app.route('/api/payments', payments);
app.route('/api/webhooks', webhooks);
app.route('/api/downloads', downloads);

// ── 404 Fallback ─────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ error: 'NOT_FOUND', message: 'Route not found' }, 404);
});

// ── Global Error Handler ─────────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    500
  );
});

// ── Startup ──────────────────────────────────────────────────────
async function start() {
  try {
    await testConnection();
    console.info('✓ Database connected');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error);
    process.exit(1);
  }

  console.info(`✓ Server starting on port ${config.port}`);
  console.info(`✓ Frontend CORS origin: ${config.frontendUrl}`);
}

start();

export default {
  port: config.port,
  fetch: app.fetch,
};
