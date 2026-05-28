-- Migration: 003_create_purchases
-- Records every payment attempt and its lifecycle.
-- user_id is NULL for guest purchases; guest_email is used instead.
-- When a user account is created later, purchases are linked by matching email.
-- Status flow: created → paid | failed | refunded

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  guest_email TEXT,
  product_id UUID NOT NULL REFERENCES products(id),
  payment_provider TEXT NOT NULL DEFAULT 'razorpay',
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT purchases_identity_check CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_guest_email ON purchases(guest_email);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON purchases(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
