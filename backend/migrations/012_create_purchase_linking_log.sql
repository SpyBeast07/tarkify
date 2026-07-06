-- Migration: 012_create_purchase_linking_log
-- Audit log for guest purchase linking events.
-- Records when and how many purchases and entitlements were linked to a user.

CREATE TABLE IF NOT EXISTS purchase_linking_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  purchases_linked INTEGER NOT NULL DEFAULT 0,
  entitlements_linked INTEGER NOT NULL DEFAULT 0,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_linking_log_user_id ON purchase_linking_log(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_linking_log_linked_at ON purchase_linking_log(linked_at);
