import { query } from '../db.js';

export interface DashboardData {
  totalPurchases: number;
  activeDownloads: number;
  recentActivity: Array<{
    purchaseId: string;
    productName: string;
    productSlug: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export interface PurchaseRow {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  payment_provider: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface DownloadRow {
  entitlement_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  purchase_id: string;
  purchase_status: string;
  granted_at: string;
  has_valid_token: boolean;
}

export interface BillingRow {
  id: string;
  product_name: string;
  product_slug: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const [purchaseResult, entitlementResult, activityResult] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM purchases WHERE user_id = $1 AND status = 'paid'`,
      [userId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(DISTINCT product_id) as count FROM entitlements WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    ),
    query<{
      id: string;
      product_name: string;
      product_slug: string;
      amount: number;
      tax_amount: number;
      total_amount: number;
      currency: string;
      status: string;
      created_at: string;
    }>(
      `SELECT p.id, pr.name as product_name, pr.slug as product_slug,
              p.amount, p.tax_amount, p.total_amount, p.currency, p.status,
              p.created_at::text as created_at
       FROM purchases p
       JOIN products pr ON pr.id = p.product_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [userId]
    ),
  ]);

  return {
    totalPurchases: parseInt(purchaseResult.rows[0]?.count ?? '0', 10),
    activeDownloads: parseInt(entitlementResult.rows[0]?.count ?? '0', 10),
    recentActivity: activityResult.rows.map((r) => ({
      purchaseId: r.id,
      productName: r.product_name,
      productSlug: r.product_slug,
      amount: r.amount,
      taxAmount: r.tax_amount,
      totalAmount: r.total_amount,
      currency: r.currency,
      status: r.status,
      createdAt: r.created_at,
    })),
  };
}

export async function getUserPurchases(
  userId: string,
  page: number,
  limit: number
): Promise<{ purchases: PurchaseRow[]; pagination: PaginationMeta }> {
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM purchases WHERE user_id = $1`,
      [userId]
    ),
    query<PurchaseRow>(
      `SELECT p.id, p.product_id,
              pr.name as product_name, pr.slug as product_slug,
              p.payment_provider, p.razorpay_order_id, p.razorpay_payment_id,
              p.razorpay_signature, p.status, p.amount, p.tax_amount, p.total_amount, p.currency,
              p.created_at::text as created_at, p.updated_at::text as updated_at
       FROM purchases p
       JOIN products pr ON pr.id = p.product_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  return {
    purchases: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserPurchaseById(
  userId: string,
  purchaseId: string
): Promise<PurchaseRow | null> {
  const result = await query<PurchaseRow>(
    `SELECT p.id, p.product_id,
            pr.name as product_name, pr.slug as product_slug,
            p.payment_provider, p.razorpay_order_id, p.razorpay_payment_id,
            p.razorpay_signature, p.status, p.amount, p.tax_amount, p.total_amount, p.currency,
            p.created_at::text as created_at, p.updated_at::text as updated_at
     FROM purchases p
     JOIN products pr ON pr.id = p.product_id
     WHERE p.id = $1 AND p.user_id = $2`,
    [purchaseId, userId]
  );
  return result.rows[0] ?? null;
}

export async function getUserDownloads(userId: string): Promise<DownloadRow[]> {
  const result = await query(
    `SELECT e.id AS entitlement_id, e.product_id,
            pr.name AS product_name, pr.slug AS product_slug,
            e.purchase_id, p.status AS purchase_status,
            e.granted_at::text AS granted_at,
            EXISTS(
              SELECT 1 FROM download_tokens dt
              WHERE dt.purchase_id = e.purchase_id AND dt.expires_at > NOW()
            ) AS has_valid_token
     FROM entitlements e
     JOIN products pr ON pr.id = e.product_id
     JOIN purchases p ON p.id = e.purchase_id
     WHERE e.user_id = $1 AND e.revoked_at IS NULL
     ORDER BY e.granted_at DESC`,
    [userId]
  );
  return result.rows as unknown as DownloadRow[];
}

export async function hasPassword(userId: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM account WHERE user_id = $1 AND provider_id = 'credential' AND password IS NOT NULL`,
    [userId]
  );
  return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
}

export async function getBillingHistory(
  userId: string,
  page: number,
  limit: number
): Promise<{ payments: BillingRow[]; pagination: PaginationMeta }> {
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM purchases WHERE user_id = $1 AND status IN ('paid', 'refunded')`,
      [userId]
    ),
    query<BillingRow>(
      `SELECT p.id, pr.name as product_name, pr.slug as product_slug,
              p.amount, p.tax_amount, p.total_amount, p.currency, p.status,
              p.razorpay_order_id, p.razorpay_payment_id,
              p.created_at::text as created_at
       FROM purchases p
       JOIN products pr ON pr.id = p.product_id
       WHERE p.user_id = $1 AND p.status IN ('paid', 'refunded')
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
  ]);

  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  return {
    payments: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
