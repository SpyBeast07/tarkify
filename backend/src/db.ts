/**
 * PostgreSQL connection pool with automatic reconnection.
 *
 * Uses node-postgres (pg) with a connection pool for efficient query execution.
 * Handles transient connection failures with exponential backoff retry.
 */

import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool-level errors without crashing.
// The pool automatically removes broken connections and creates new ones
// on the next acquire — no manual reconnect needed for pg.Pool.
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * A connection-level error that may be transient.
 */
function isTransientError(err: Error): boolean {
  const msg = err.message;
  return (
    msg.includes('Connection terminated') ||
    msg.includes('Connection refused') ||
    msg.includes('timeout') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('socket') ||
    msg.includes('getaddrinfo') ||
    msg.includes('terminating connection') ||
    (err as any).code === '57P01' || // terminating connection
    (err as any).code === '08006' || // connection failure
    (err as any).code === '08001'    // cannot establish connection
  );
}

const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a parameterized query with automatic retry for transient failures.
 *
 * Retries up to `MAX_RETRIES` times with exponential backoff
 * (200ms, 400ms, 800ms) when the database connection drops temporarily.
 * Application errors (constraint violations, syntax errors, etc.) are
 * thrown immediately without retry.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await pool.query<T>(text, params);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (!isTransientError(lastError) || attempt === MAX_RETRIES) {
        throw lastError;
      }

      const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms
      console.warn(
        `Database query attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Run multiple queries atomically inside a BEGIN/COMMIT transaction.
 *
 * If the callback throws, ROLLBACK is issued automatically before re-throwing.
 * Transient connection errors during client acquisition are retried.
 *
 * Usage:
 *   const result = await withTransaction(async (client) => {
 *     await client.query('UPDATE ...');
 *     await client.query('INSERT ...');
 *     return someValue;
 *   });
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  let client: pg.PoolClient | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!isTransientError(lastError) || attempt === MAX_RETRIES) {
        throw lastError;
      }
      const delay = Math.pow(2, attempt) * 100;
      console.warn(
        `Database connect attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  if (!client) {
    throw lastError ?? new Error('Failed to acquire database connection');
  }

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verify database connectivity at startup.
 * Retries up to `MAX_RETRIES` times with exponential backoff.
 */
export async function testConnection(): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.info('✓ Database connection verified');
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }
      const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
      console.warn(
        `Database connection attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );
      await sleep(delay);
    }
  }

  throw lastError ?? new Error('Could not connect to database');
}
