/**
 * Purchase Service
 *
 * Manages purchase lifecycle and entitlement grants.
 * Uses user_id for registered users, guest_email for guest purchases.
 * All state-changing operations are idempotent — safe to call
 * from both the frontend verification callback and webhooks.
 */

import { query } from '../db.js';
import type { Purchase, Entitlement } from '../types/index.js';

/**
 * Create a new purchase record when a Razorpay order is created.
 * Status starts as 'created'.
 * For guest purchases, user_id is null and guest_email is used.
 */
export async function createPurchase(
  guestEmail: string,
  productId: string,
  razorpayOrderId: string,
  amount: number,
  currency: string
): Promise<Purchase> {
  const result = await query<Purchase>(
    `INSERT INTO purchases (guest_email, product_id, razorpay_order_id, amount, currency, status)
     VALUES ($1, $2, $3, $4, $5, 'created')
     RETURNING *`,
    [guestEmail, productId, razorpayOrderId, amount, currency]
  );
  return result.rows[0];
}

/**
 * Find a purchase by its Razorpay order ID.
 */
export async function getPurchaseByOrderId(
  razorpayOrderId: string
): Promise<Purchase | null> {
  const result = await query<Purchase>(
    'SELECT * FROM purchases WHERE razorpay_order_id = $1',
    [razorpayOrderId]
  );
  return result.rows[0] ?? null;
}

/**
 * Complete a purchase — update status to 'paid' and record payment details.
 *
 * Idempotent: if already paid, returns the existing purchase without modification.
 * This is critical because both the frontend verify callback and the webhook
 * may call this for the same payment.
 */
export async function completePurchase(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<Purchase | null> {
  // First check current status to handle idempotency
  const existing = await getPurchaseByOrderId(razorpayOrderId);
  if (!existing) return null;

  // Already completed — return as-is
  if (existing.status === 'paid') {
    return existing;
  }

  const result = await query<Purchase>(
    `UPDATE purchases
     SET status = 'paid',
         razorpay_payment_id = $1,
         razorpay_signature = $2,
         updated_at = NOW()
     WHERE razorpay_order_id = $3 AND status = 'created'
     RETURNING *`,
    [razorpayPaymentId, razorpaySignature, razorpayOrderId]
  );

  return result.rows[0] ?? existing;
}

/**
 * Mark a purchase as failed.
 */
export async function failPurchase(
  razorpayOrderId: string
): Promise<Purchase | null> {
  const result = await query<Purchase>(
    `UPDATE purchases
     SET status = 'failed', updated_at = NOW()
     WHERE razorpay_order_id = $1 AND status = 'created'
     RETURNING *`,
    [razorpayOrderId]
  );
  return result.rows[0] ?? null;
}

/**
 * Grant product ownership to a guest purchaser.
 *
 * Uses ON CONFLICT on the partial unique index to ensure idempotency —
 * if the entitlement already exists, no duplicate is created.
 * This handles the case where both the frontend verification and webhook
 * grant ownership for the same purchase.
 */
export async function grantEntitlement(
  guestEmail: string,
  productId: string,
  purchaseId: string
): Promise<Entitlement> {
  const result = await query<Entitlement>(
    `INSERT INTO entitlements (guest_email, product_id, purchase_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (guest_email, product_id) WHERE guest_email IS NOT NULL AND user_id IS NULL
     DO UPDATE SET purchase_id = $3, granted_at = NOW(), revoked_at = NULL
     RETURNING *`,
    [guestEmail, productId, purchaseId]
  );
  return result.rows[0];
}

/**
 * Check if a guest email has an active entitlement for a product.
 * Only considers non-revoked entitlements.
 */
export async function hasEntitlement(
  guestEmail: string,
  productId: string
): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM entitlements
     WHERE guest_email = $1 AND product_id = $2 AND revoked_at IS NULL
     LIMIT 1`,
    [guestEmail, productId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Check entitlement by product slug (convenience method).
 * Resolves the product ID internally.
 */
export async function hasEntitlementBySlug(
  guestEmail: string,
  productSlug: string
): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM entitlements e
     JOIN products p ON p.id = e.product_id
     WHERE e.guest_email = $1 AND p.slug = $2 AND e.revoked_at IS NULL
     LIMIT 1`,
    [guestEmail, productSlug]
  );
  return result.rowCount !== null && result.rowCount > 0;
}
