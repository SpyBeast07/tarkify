import { query } from '../../db.js';
import type { PaymentListItem, PaymentDetail, PaymentListParams, PaymentAuditEntry, RefundInfo, ReceiptInfo } from './types.js';

function buildListWhere(params: PaymentListParams): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(
      p.id::text ILIKE $${idx}
      OR u.name ILIKE $${idx}
      OR COALESCE(u.email, p.guest_email) ILIKE $${idx}
      OR p.razorpay_order_id ILIKE $${idx}
      OR p.razorpay_payment_id ILIKE $${idx}
      OR pr.name ILIKE $${idx}
    )`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status) {
    conditions.push(`p.status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  if (params.dateFrom) {
    conditions.push(`p.created_at >= $${idx}::timestamptz`);
    values.push(params.dateFrom);
    idx++;
  }

  if (params.dateTo) {
    conditions.push(`p.created_at <= $${idx}::timestamptz`);
    values.push(params.dateTo);
    idx++;
  }

  if (params.customer) {
    conditions.push(`(
      u.name ILIKE $${idx}
      OR COALESCE(u.email, p.guest_email) ILIKE $${idx}
    )`);
    values.push(`%${params.customer}%`);
    idx++;
  }

  if (params.product) {
    conditions.push(`pr.id = $${idx}`);
    values.push(params.product);
    idx++;
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

function buildOrderBy(sort: string): string {
  switch (sort) {
    case 'oldest': return 'p.created_at ASC';
    case 'amount': return 'p.amount DESC';
    case 'status': return 'p.status ASC, p.created_at DESC';
    default: return 'p.created_at DESC';
  }
}

export async function listPayments(params: PaymentListParams): Promise<{ payments: PaymentListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;

  const { clause, values } = buildListWhere(params);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM purchases p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN products pr ON pr.id = p.product_id
     ${clause}`,
    values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<PaymentListItem>(
    `SELECT
      p.id,
      p.razorpay_order_id,
      p.razorpay_payment_id,
      u.name AS customer_name,
      COALESCE(u.email, p.guest_email) AS customer_email,
      pr.name AS product_name,
      p.amount,
      p.currency,
      p.status,
      p.payment_provider,
      p.created_at,
      p.updated_at
    FROM purchases p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.id = p.product_id
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );

  return { payments: result.rows, total };
}

export async function getPaymentById(id: string): Promise<PaymentDetail | null> {
  const result = await query<PaymentDetail>(
    `SELECT
      p.id,
      p.user_id,
      p.guest_email,
      u.name AS customer_name,
      COALESCE(u.email, p.guest_email) AS customer_email,
      p.product_id,
      pr.name AS product_name,
      pr.slug AS product_slug,
      p.payment_provider,
      p.razorpay_order_id,
      p.razorpay_payment_id,
      p.razorpay_signature,
      p.status,
      p.amount,
      p.currency,
      p.created_at,
      p.updated_at
    FROM purchases p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.id = p.product_id
    WHERE p.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getRefundInfo(purchaseId: string): Promise<RefundInfo> {
  const purchase = await query<{ status: string; amount: number; updated_at: string }>(
    'SELECT status, amount, updated_at FROM purchases WHERE id = $1',
    [purchaseId],
  );

  if (purchase.rows.length === 0) {
    return { status: 'not_refunded', refunded_at: null, refund_amount: null, refund_reason: null };
  }

  const p = purchase.rows[0];
  if (p.status === 'refunded') {
    return {
      status: 'refunded',
      refunded_at: p.updated_at,
      refund_amount: p.amount,
      refund_reason: null,
    };
  }

  return { status: 'not_refunded', refunded_at: null, refund_amount: null, refund_reason: null };
}

export async function getReceiptInfo(purchaseId: string): Promise<ReceiptInfo | null> {
  const result = await query<ReceiptInfo>(
    `SELECT
      p.id AS receipt_number,
      p.created_at AS purchase_date,
      p.amount,
      p.currency,
      p.razorpay_payment_id,
      p.razorpay_order_id,
      pr.name AS product_name,
      COALESCE(u.email, p.guest_email) AS customer_email,
      u.name AS customer_name
    FROM purchases p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.id = p.product_id
    WHERE p.id = $1`,
    [purchaseId],
  );
  return result.rows[0] ?? null;
}

export async function getPaymentAuditLog(entityId: string): Promise<PaymentAuditEntry[]> {
  const result = await query<PaymentAuditEntry>(
    `SELECT
      a.id, a.event, a.user_id, u.name AS user_name,
      a.metadata, a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.metadata->>'purchase_id' = $1
       OR a.metadata->>'purchaseId' = $1
       OR a.metadata->>'payment_id' = $1
       OR a.metadata->>'paymentId' = $1
    ORDER BY a.created_at DESC
    LIMIT 100`,
    [entityId],
  );
  return result.rows;
}

export async function getProductOptions(): Promise<{ id: string; name: string }[]> {
  const result = await query<{ id: string; name: string }>(
    "SELECT id, name FROM products WHERE status = 'published' ORDER BY name ASC",
  );
  return result.rows;
}
