import pg from 'pg';
import fs from 'fs';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
console.log(`Connecting to database at: ${maskedUrl}`);

const pool = new pg.Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10_000,
  max: 2,
});

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(): Promise<void> {
  const MAX_ATTEMPTS = 10;
  const RETRY_DELAY_MS = 3_000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.log('✓ Database ready');
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_ATTEMPTS) {
        console.warn(
          `Database not ready (attempt ${attempt}/${MAX_ATTEMPTS}): ${msg}. Retrying in ${RETRY_DELAY_MS}ms...`
        );
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error(
          `Could not connect to database after ${MAX_ATTEMPTS} attempts: ${msg}`
        );
      }
    }
  }
}

async function run() {
  // Phase 1: Wait for PostgreSQL to accept connections
  console.log('Waiting for database...');
  await waitForDatabase();

  const client = await pool.connect();
  try {
    // Phase 2: Create migrations tracking table (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Phase 3: Discover migration files
    const migrationsDir = path.join(import.meta.dir, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s)`);

    if (files.length === 0) {
      console.log('No pending migrations to apply.');
      return;
    }

    // Phase 4: Apply pending migrations
    let applied = 0;
    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (rows.length > 0) {
        console.log(`  SKIP  ${file} (already applied)`);
        continue;
      }

      console.log(`  APPLY ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  OK    ${file}`);
        applied++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  FAIL  ${file}`);
        throw err;
      }
    }

    console.log(`\n✓ ${applied} new migration(s) applied`);
    if (applied === 0) {
      console.log('✓ Database schema is up to date');
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
