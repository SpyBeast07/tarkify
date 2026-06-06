/**
 * Purchase Service
 *
 * Manages purchase lifecycle and entitlement grants.
 * Uses user_id for registered users, guest_email for guest purchases.
 * All state-changing operations are idempotent — safe to call
 * from both the frontend verification callback and webhooks.
 *
 * HARDENED:
 * - All emails are normalised (trimmed + lowercased) before storage or lookup.
 * - completePurchaseAndGrantEntitlement wraps UPDATE + INSERT in a single
 *   database transaction to prevent orphaned paid purchases.
 * - Download tokens are cryptographically random and time-limited.
 */

import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { config } from '../config.js';
import type { Purchase, Entitlement, DownloadToken } from '../types/index.js';
import type pg from 'pg';

// ── Email normalisation ───────────────────────────────────────────

/**
 * Normalise an email address before any storage or comparison.
 * Trim whitespace and lowercase. Keeps the implementation consistent
 * regardless of what the user typed.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ── Purchase lifecycle ────────────────────────────────────────────

/**
 * Create a new purchase record when a Razorpay order is created.
 * Status starts as 'created'.
 * For guest purchases, user_id is null and guest_email is used.
 * Email is normalised before storage.
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
    [normaliseEmail(guestEmail), productId, razorpayOrderId, amount, currency]
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
 * Complete a purchase AND grant the entitlement atomically inside
 * a single PostgreSQL transaction.
 *
 * This is the primary path for both the frontend /verify callback and
 * the webhook handler.  Using a transaction guarantees that no purchase
 * can end up in the 'paid' state without a corresponding entitlement, and
 * vice-versa.
 *
 * Idempotent: if the purchase is already 'paid', the existing record is
 * returned immediately without touching the database.
 *
 * @returns The updated (or already-paid) purchase, or null if not found.
 */
export async function completePurchaseAndGrantEntitlement(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<Purchase | null> {
  // Fast-path: check outside the transaction first to avoid unnecessary locking.
  const existing = await getPurchaseByOrderId(razorpayOrderId);
  if (!existing) return null;

  // Already fully completed — idempotent return.
  if (existing.status === 'paid') {
    return existing;
  }

  return withTransaction(async (client) => {
    // UPDATE inside the transaction; the WHERE status = 'created' guard
    // means concurrent calls are safe — only one will change rows.
    const updateResult = await client.query<Purchase>(
      `UPDATE purchases
       SET status = 'paid',
           razorpay_payment_id = $1,
           razorpay_signature  = $2,
           updated_at          = NOW()
       WHERE razorpay_order_id = $3 AND status = 'created'
       RETURNING *`,
      [razorpayPaymentId, razorpaySignature, razorpayOrderId]
    );

    // Another concurrent call already completed the purchase;
    // return the existing row without error.
    const purchase = updateResult.rows[0] ?? existing;

    // Grant entitlement only for guest purchases (user_id is NULL).
    // ON CONFLICT ensures idempotency if this runs a second time.
    if (purchase.guest_email) {
      await client.query(
        `INSERT INTO entitlements (guest_email, product_id, purchase_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (guest_email, product_id)
           WHERE guest_email IS NOT NULL AND user_id IS NULL
         DO UPDATE SET purchase_id = $3, granted_at = NOW(), revoked_at = NULL`,
        [purchase.guest_email, purchase.product_id, purchase.id]
      );
    }

    return purchase;
  });
}

/**
 * Mark a purchase as failed.
 * Only transitions from 'created' — paid purchases cannot be failed.
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
 * Mark a purchase as refunded and revoke the entitlement atomically.
 * Does NOT delete any records — audit history is preserved.
 * Only transitions from 'paid' to 'refunded'.
 */
export async function refundPurchase(
  razorpayOrderId: string
): Promise<Purchase | null> {
  const existing = await getPurchaseByOrderId(razorpayOrderId);
  if (!existing || existing.status !== 'paid') return null;

  return withTransaction(async (client) => {
    const updateResult = await client.query<Purchase>(
      `UPDATE purchases
       SET status = 'refunded', updated_at = NOW()
       WHERE razorpay_order_id = $1 AND status = 'paid'
       RETURNING *`,
      [razorpayOrderId]
    );

    const purchase = updateResult.rows[0];
    if (!purchase) return existing; // Another concurrent call already handled it.

    // Revoke the entitlement — set revoked_at so hasEntitlement returns false.
    await client.query(
      `UPDATE entitlements
       SET revoked_at = NOW()
       WHERE purchase_id = $1 AND revoked_at IS NULL`,
      [purchase.id]
    );

    // Invalidate any outstanding download tokens for this purchase.
    await client.query(
      `UPDATE download_tokens
       SET expires_at = NOW()
       WHERE purchase_id = $1 AND expires_at > NOW()`,
      [purchase.id]
    );

    return purchase;
  });
}

// ── Entitlement queries ───────────────────────────────────────────

/**
 * Check if a guest email has an active entitlement for a product.
 * Only considers non-revoked entitlements.
 * Email is normalised before lookup.
 */
export async function hasEntitlement(
  guestEmail: string,
  productId: string
): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM entitlements
     WHERE guest_email = $1 AND product_id = $2 AND revoked_at IS NULL
     LIMIT 1`,
    [normaliseEmail(guestEmail), productId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Check entitlement by product slug (convenience method).
 * Resolves the product ID internally.
 * Email is normalised before lookup.
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
    [normaliseEmail(guestEmail), productSlug]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// ── Download tokens ───────────────────────────────────────────────

/**
 * Issue a secure download token for a completed purchase.
 *
 * The token is 32 random bytes encoded as hex (64 chars).
 * It is stored in the database linked to the purchase + product so
 * the download endpoint can verify ownership without trusting the
 * email address.
 *
 * Tokens expire after config.downloadTokenTtlSeconds (default 10 min).
 * They are reusable until expiry — the user can click "Download" multiple
 * times within the window.
 *
 * Optionally accepts a pg.PoolClient so this can run inside an existing
 * transaction; if omitted a standalone query is used.
 */
export async function generateDownloadToken(
  purchaseId: string,
  productId: string,
  client?: pg.PoolClient
): Promise<DownloadToken> {
  const token = crypto.randomBytes(32).toString('hex');
  const ttl = config.downloadTokenTtlSeconds;

  const sql = `
    INSERT INTO download_tokens (token, purchase_id, product_id, expires_at)
    VALUES ($1, $2, $3, NOW() + ($4 || ' seconds')::INTERVAL)
    RETURNING *`;
  const params = [token, purchaseId, productId, ttl.toString()];

  const result = client
    ? await client.query<DownloadToken>(sql, params)
    : await query<DownloadToken>(sql, params);

  return result.rows[0];
}

/**
 * Validate a download token.
 *
 * Returns the token record if:
 *   - it exists in the database
 *   - it has not expired (expires_at > NOW())
 *
 * Returns null if the token is invalid, unknown, or expired.
 * Does NOT delete the token — it remains valid until expiry.
 */
export async function validateDownloadToken(
  token: string
): Promise<DownloadToken | null> {
  const result = await query<DownloadToken>(
    `SELECT * FROM download_tokens
     WHERE token = $1 AND expires_at > NOW()
     LIMIT 1`,
    [token]
  );
  return result.rows[0] ?? null;
}
