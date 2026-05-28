-- Migration: 002_create_products
-- Products table is the source of truth for catalog, pricing, and download mapping.
-- Prices are stored in smallest currency unit (paise for INR).
-- download_key maps to storage/products/{download_key}/ for file serving.
-- type prepares for subscriptions without schema changes.

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'ONE_TIME',
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  download_key TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- Seed DevBeast as the first product
INSERT INTO products (slug, name, description, type, price, currency, download_key)
VALUES (
  'devbeast',
  'DevBeast',
  'Local-first DevOps control plane for modern development teams',
  'ONE_TIME',
  2900,
  'INR',
  'devbeast'
)
ON CONFLICT (slug) DO NOTHING;
