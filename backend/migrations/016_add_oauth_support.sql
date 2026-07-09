-- Migration: 016_add_oauth_support
-- Ensures the account table can handle OAuth provider accounts (e.g. Google).
-- Better Auth uses (provider_id, account_id) as the unique pair for OAuth accounts.
-- Adding this unique constraint prevents duplicate account rows for the same provider.
--
-- No new tables are needed — the existing `account` table already has all required columns
-- (provider_id, account_id, access_token, refresh_token, etc.) from migration 010.

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_provider_account
  ON account(provider_id, account_id);