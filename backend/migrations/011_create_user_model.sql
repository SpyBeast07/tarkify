-- Migration: 011_create_user_model
-- Extends the users table with Tarkify-specific business fields.
-- Better Auth owns identity (email, password, sessions, verification).
-- Tarkify owns business data (role, display_name, timezone, preferences, activity tracking, account_status).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE';

-- Add CHECK constraint on roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'super_admin'));

-- Add CHECK constraint on account_status
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED'));

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
