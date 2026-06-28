-- Migration: 006_create_unique_active_purchase
-- Prevents duplicate active purchases per guest email + product.
-- This closes the race window between hasEntitlement() check and createPurchase()
-- where two concurrent requests could both create Razorpay orders for the same
-- email + product combination, resulting in double charges.
--
-- The partial index only covers 'created' and 'paid' statuses, allowing customers
-- to re-purchase after a 'failed' or 'refunded' purchase.

-- First, clean up any existing duplicates that would violate the unique index.
-- Keep only the most recent row per (guest_email, product_id) for active statuses,
-- mark older duplicates as 'failed' so they don't block the index.
WITH duplicates AS (
  SELECT id, guest_email, product_id,
    ROW_NUMBER() OVER (
      PARTITION BY guest_email, product_id
      ORDER BY created_at DESC
    ) AS rn
  FROM purchases
  WHERE guest_email IS NOT NULL
    AND status IN ('created', 'paid')
)
UPDATE purchases p
SET status = 'failed',
    updated_at = NOW()
FROM duplicates d
WHERE p.id = d.id
  AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_active_guest_product
ON purchases (guest_email, product_id)
WHERE guest_email IS NOT NULL AND status IN ('created', 'paid');
