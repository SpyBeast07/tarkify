import { query, withTransaction } from '../db.js';
import type { Purchase, Entitlement } from '../types/index.js';

export async function findGuestPurchases(email: string): Promise<Purchase[]> {
  const result = await query<Purchase>(
    `SELECT * FROM purchases
     WHERE guest_email = $1 AND user_id IS NULL
     ORDER BY created_at ASC`,
    [email]
  );
  return result.rows;
}

export async function findGuestEntitlements(email: string): Promise<Entitlement[]> {
  const result = await query<Entitlement>(
    `SELECT * FROM entitlements
     WHERE guest_email = $1 AND user_id IS NULL
     ORDER BY granted_at ASC`,
    [email]
  );
  return result.rows;
}

export async function linkPurchases(
  userId: string,
  email: string
): Promise<number> {
  const result = await query(
    `UPDATE purchases
     SET user_id = $1::uuid, updated_at = NOW()
     WHERE guest_email = $2 AND user_id IS NULL`,
    [userId, email]
  );
  return result.rowCount ?? 0;
}

export async function linkEntitlements(
  userId: string,
  email: string
): Promise<number> {
  const result = await query(
    `UPDATE entitlements
     SET user_id = $1::uuid
     WHERE guest_email = $2
       AND user_id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM entitlements e2
         WHERE e2.user_id = $1::uuid
           AND e2.product_id = entitlements.product_id
           AND e2.revoked_at IS NULL
       )`,
    [userId, email]
  );
  return result.rowCount ?? 0;
}

export async function removeConflictingEntitlements(
  userId: string,
  email: string
): Promise<number> {
  const result = await query(
    `DELETE FROM entitlements
     WHERE guest_email = $1
       AND user_id IS NULL
       AND EXISTS (
         SELECT 1 FROM entitlements e2
         WHERE e2.user_id = $2::uuid
           AND e2.product_id = entitlements.product_id
           AND e2.revoked_at IS NULL
       )`,
    [email, userId]
  );
  return result.rowCount ?? 0;
}

export async function insertLinkingLog(
  userId: string,
  email: string,
  purchasesLinked: number,
  entitlementsLinked: number
): Promise<void> {
  await query(
    `INSERT INTO purchase_linking_log (user_id, email, purchases_linked, entitlements_linked)
     VALUES ($1, $2, $3, $4)`,
    [userId, email, purchasesLinked, entitlementsLinked]
  );
}

export async function linkPurchasesAndEntitlements(
  userId: string,
  email: string
): Promise<{ purchasesLinked: number; entitlementsLinked: number }> {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `UPDATE purchases
       SET user_id = $1::uuid, updated_at = NOW()
       WHERE guest_email = $2 AND user_id IS NULL`,
      [userId, email]
    );
    const purchasesLinked = purchaseResult.rowCount ?? 0;

    const entitlementResult = await client.query(
      `UPDATE entitlements
       SET user_id = $1::uuid
       WHERE guest_email = $2
         AND user_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM entitlements e2
           WHERE e2.user_id = $1::uuid
             AND e2.product_id = entitlements.product_id
             AND e2.revoked_at IS NULL
         )`,
      [userId, email]
    );
    const entitlementsLinked = entitlementResult.rowCount ?? 0;

    await client.query(
      `DELETE FROM entitlements
       WHERE guest_email = $1
         AND user_id IS NULL
         AND EXISTS (
           SELECT 1 FROM entitlements e2
           WHERE e2.user_id = $2::uuid
             AND e2.product_id = entitlements.product_id
             AND e2.revoked_at IS NULL
         )`,
      [email, userId]
    );

    return { purchasesLinked, entitlementsLinked };
  });
}
