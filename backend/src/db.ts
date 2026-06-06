/**
 * PostgreSQL connection pool.
 * Uses node-postgres (pg) with a connection pool for efficient query execution.
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

/**
 * Execute a parameterized query against the database.
 * Always use parameterized queries to prevent SQL injection.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Run multiple queries atomically inside a BEGIN/COMMIT transaction.
 * If the callback throws, ROLLBACK is issued automatically before re-throwing.
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verify database connectivity at startup.
 */
export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}
