-- Migration: 006_create_unique_active_purchase
-- Prevents duplicate active purchases per guest email + product.
-- This closes the race window between hasEntitlement() check and createPurchase()
-- where two concurrent requests could both create Razorpay orders for the same
-- email + product combination, resulting in double charges.
--
-- The partial index only covers 'created' and 'paid' statuses, allowing customers
-- to re-purchase after a 'failed' or 'refunded' purchase.

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_active_guest_product
ON purchases (guest_email, product_id)
WHERE guest_email IS NOT NULL AND status IN ('created', 'paid');
