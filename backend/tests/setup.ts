// Test setup — runs before all test files.
// Sets default env vars needed by config.ts during test module loading.

process.env.ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.tarkify';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-123';
