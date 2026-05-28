-- Migration: 001_create_users
-- Users table is the identity foundation.
-- Guest purchases use guest_email; when a user creates an account later,
-- existing purchases are linked by matching the verified email address.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
