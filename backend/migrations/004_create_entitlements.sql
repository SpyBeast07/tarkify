-- Migration: 004_create_entitlements
-- Records product ownership.
-- Supports both registered users and guest purchasers.
-- Partial unique indexes ensure idempotent grants for each identity type.

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  guest_email TEXT,
  product_id UUID NOT NULL REFERENCES products(id),
  purchase_id UUID NOT NULL REFERENCES purchases(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT entitlements_identity_check CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

-- Partial unique indexes: one entitlement per product per identity
CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_user_product
  ON entitlements(user_id, product_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_guest_product
  ON entitlements(guest_email, product_id)
  WHERE guest_email IS NOT NULL AND user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_guest_email ON entitlements(guest_email);
