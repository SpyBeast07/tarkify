-- Migration: 020_add_purchase_tax
-- Stores the tax breakdown alongside each purchase so receipts, the admin
-- portal, and the customer portal can display GST consistently.
-- `amount` remains the base product price (preserves historical analytics).

ALTER TABLE IF EXISTS purchases
  ADD COLUMN IF NOT EXISTS tax_amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount INTEGER NOT NULL DEFAULT 0;

-- Backfill: for any pre-existing row where total_amount is still 0, treat the
-- stored `amount` as the total (no tax was collected before this migration).
UPDATE purchases
SET total_amount = amount
WHERE total_amount = 0;
