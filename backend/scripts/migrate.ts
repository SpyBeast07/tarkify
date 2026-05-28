import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Bun automatically loads environment variables from .env
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Error: DATABASE_URL environment variable is not defined in .env.");
  process.exit(1);
}

// Strip password from connection string for logging safety
const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
console.log(`Connecting to database at: ${maskedUrl}`);

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

async function run() {
  const client = await pool.connect();
  try {
    // 1. Create a migrations table if it doesn't exist to track run state
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Read migration SQL files
    const migrationsDir = path.join(import.meta.dir, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure order: 001 -> 002 -> 003 -> 004

    console.log(`Found ${files.length} migration file(s) in ${migrationsDir}`);

    // 3. Execute each pending migration
    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
      if (rows.length > 0) {
        console.log(`Migration "${file}" already applied. Skipping.`);
        continue;
      }

      console.log(`Applying migration: "${file}"...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Start database transaction
      await client.query('BEGIN');
      try {
        // Run migration script
        await client.query(sql);
        
        // Log migration history
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        
        await client.query('COMMIT');
        console.log(`Successfully applied: "${file}"`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration: "${file}". Rolling back changes.`);
        throw err;
      }
    }

    console.log("Database migrations completed successfully!");
  } catch (error) {
    console.error("Migration execution failed:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
