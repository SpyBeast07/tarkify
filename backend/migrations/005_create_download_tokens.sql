-- Migration: 005_create_download_tokens
-- Secure download authorization.
-- Replaces the email-query-param approach with cryptographically secure tokens.
--
-- A token is issued after a verified payment.
-- It is scoped to exactly one purchase + one product.
-- It expires after a configurable TTL (default 10 minutes).
-- Tokens are reusable until expiration (no single-use delete).
-- Revoking: set expires_at to NOW() or a past timestamp.

CREATE TABLE IF NOT EXISTS download_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        NOT NULL UNIQUE,          -- hex-encoded 32-byte random
  purchase_id UUID        NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_tokens_token      ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_purchase   ON download_tokens(purchase_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires_at ON download_tokens(expires_at);
