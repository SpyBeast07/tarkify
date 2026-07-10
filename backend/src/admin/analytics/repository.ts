import { query } from '../../db.js';
import type {
  TimeSeriesPoint,
  RevenueBreakdown,
  RevenueAnalytics,
  OrdersBreakdown,
  OrdersAnalytics,
  DownloadsBreakdown,
  DownloadsAnalytics,
  ProductCount,
  ProductsBreakdown,
  ProductsAnalytics,
  TopProduct,
  DownloadProduct,
  CustomersBreakdown,
  CustomersAnalytics,
  EmailsBreakdown,
  EmailsAnalytics,
  EmailTypeCount,
  TrafficAnalytics,
  GrowthAnalytics,
  GrowthMetric,
} from './types.js';

type Bucket = 'hour' | 'day' | 'month';

function bucketFormat(bucket: Bucket): string {
  if (bucket === 'hour') return 'YYYY-MM-DD HH24:MI';
  if (bucket === 'month') return 'YYYY-MM';
  return 'YYYY-MM-DD';
}

/**
 * Reusable continuous time-series builder. Fills gaps with generate_series so
 * charts always render a complete axis. Table/column names are internal
 * constants (never user input); only start/end and optional whereValues are
 * parameterized.
 */
async function fetchSeries(params: {
  table: string;
  dateColumn: string;
  bucket: Bucket;
  start: Date;
  end: Date;
  agg: string;
  join?: string;
  where?: string;
  whereValues?: unknown[];
}): Promise<TimeSeriesPoint[]> {
  const fmt = bucketFormat(params.bucket);
  const sql = `
    WITH series AS (
      SELECT generate_series(
        date_trunc($1, $2::timestamptz),
        date_trunc($1, $3::timestamptz),
        ('1 ' || $1)::interval
      ) AS bucket
    )
    SELECT to_char(s.bucket, '${fmt}') AS date, (${params.agg}) AS value
    FROM series s
    LEFT JOIN ${params.table} t ${params.join ?? ''}
      ON date_trunc($1, t.${params.dateColumn}) = s.bucket
      AND t.${params.dateColumn} >= $2::timestamptz
      AND t.${params.dateColumn} <= $3::timestamptz
      ${params.where ? `AND ${params.where}` : ''}
    GROUP BY s.bucket
    ORDER BY s.bucket
  `;
  const values = [
    params.bucket,
    params.start.toISOString(),
    params.end.toISOString(),
    ...(params.whereValues ?? []),
  ];
  const result = await query<{ date: string; value: number }>(sql, values);
  return result.rows.map((r) => ({ date: r.date, value: Number(r.value) }));
}

// ─── Revenue ───────────────────────────────────────────────────────────────

export async function getRevenueSummary(start: Date, end: Date): Promise<RevenueBreakdown> {
  const result = await query<{
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
    avg: number;
  }>(
    `SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::numeric / 100.0 AS paid,
      COALESCE(SUM(amount) FILTER (WHERE status = 'created'), 0)::numeric / 100.0 AS pending,
      COALESCE(SUM(amount) FILTER (WHERE status = 'failed'), 0)::numeric / 100.0 AS failed,
      COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)::numeric / 100.0 AS refunded,
      CASE
        WHEN COUNT(*) FILTER (WHERE status = 'paid') > 0
        THEN (SUM(amount) FILTER (WHERE status = 'paid'))::numeric / (COUNT(*) FILTER (WHERE status = 'paid')) / 100.0
        ELSE 0
      END AS avg
    FROM purchases
    WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  const row = result.rows[0];
  return {
    total: Number(row.paid),
    paid: Number(row.paid),
    pending: Number(row.pending),
    failed: Number(row.failed),
    refunded: Number(row.refunded),
    averageOrderValue: Number(row.avg),
  };
}

export async function getRevenueAnalytics(start: Date, end: Date, bucket: Bucket): Promise<RevenueAnalytics> {
  const [summary, trend] = await Promise.all([
    getRevenueSummary(start, end),
    fetchSeries({
      table: 'purchases',
      dateColumn: 'created_at',
      bucket,
      start,
      end,
      agg: `COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'paid'), 0)::numeric / 100.0`,
    }),
  ]);
  return { ...summary, trend };
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function getOrdersSummary(start: Date, end: Date): Promise<OrdersBreakdown> {
  const result = await query<{
    total: number;
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
  }>(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'paid')::int AS paid,
      COUNT(*) FILTER (WHERE status = 'created')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE status = 'refunded')::int AS refunded
    FROM purchases
    WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  const row = result.rows[0];
  const conversionRate = row.total > 0 ? Math.round((row.paid / row.total) * 1000) / 10 : 0;
  return {
    total: row.total,
    paid: row.paid,
    pending: row.pending,
    failed: row.failed,
    refunded: row.refunded,
    conversionRate,
  };
}

export async function getOrdersAnalytics(start: Date, end: Date, bucket: Bucket): Promise<OrdersAnalytics> {
  const [summary, daily] = await Promise.all([
    getOrdersSummary(start, end),
    fetchSeries({
      table: 'purchases',
      dateColumn: 'created_at',
      bucket,
      start,
      end,
      agg: `COUNT(t.id)::int`,
    }),
  ]);
  return { ...summary, daily };
}

// ─── Downloads ─────────────────────────────────────────────────────────────

export async function getDownloadsSummary(start: Date, end: Date): Promise<DownloadsBreakdown> {
  const result = await query<{
    total: number;
    unique: number;
    active: number;
    expired: number;
  }>(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(DISTINCT purchase_id)::int AS unique,
      COUNT(*) FILTER (WHERE expires_at > NOW())::int AS active,
      COUNT(*) FILTER (WHERE expires_at <= NOW())::int AS expired
    FROM download_tokens
    WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  const row = result.rows[0];
  return {
    total: row.total,
    unique: row.unique,
    activeTokens: row.active,
    expiredTokens: row.expired,
  };
}

export async function getDownloadsAnalytics(start: Date, end: Date, bucket: Bucket): Promise<DownloadsAnalytics> {
  const [summary, perProduct, trend] = await Promise.all([
    getDownloadsSummary(start, end),
    query<ProductCount>(
      `SELECT pr.name AS product, dt.product_id AS "productId", COUNT(*)::int AS count,
              COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0)::numeric / 100.0 AS revenue
       FROM download_tokens dt
       LEFT JOIN products pr ON pr.id = dt.product_id
       LEFT JOIN purchases p ON p.id = dt.purchase_id
       WHERE dt.created_at >= $1::timestamptz AND dt.created_at <= $2::timestamptz
       GROUP BY pr.name, dt.product_id
       ORDER BY count DESC
       LIMIT 10`,
      [start.toISOString(), end.toISOString()],
    ),
    fetchSeries({
      table: 'download_tokens',
      dateColumn: 'created_at',
      bucket,
      start,
      end,
      agg: `COUNT(t.id)::int`,
    }),
  ]);
  return {
    ...summary,
    perProduct: perProduct.rows.map((r) => ({ ...r, revenue: Number(r.revenue) })),
    trend,
  };
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function getProductsSummary(): Promise<ProductsBreakdown> {
  const result = await query<{
    total: number;
    published: number;
    draft: number;
    archived: number;
  }>(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
      COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
    FROM products`,
  );
  return result.rows[0];
}

export async function getProductsAnalytics(start: Date, end: Date): Promise<ProductsAnalytics> {
  const [summary, topSelling, mostDownloaded] = await Promise.all([
    getProductsSummary(),
    query<TopProduct>(
      `SELECT pr.name AS product, p.product_id AS "productId",
              COUNT(*)::int AS orders,
              COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0)::numeric / 100.0 AS revenue
       FROM purchases p
       LEFT JOIN products pr ON pr.id = p.product_id
       WHERE p.created_at >= $1::timestamptz AND p.created_at <= $2::timestamptz
       GROUP BY pr.name, p.product_id
       ORDER BY orders DESC
       LIMIT 10`,
      [start.toISOString(), end.toISOString()],
    ),
    query<DownloadProduct>(
      `SELECT pr.name AS product, dt.product_id AS "productId", COUNT(*)::int AS downloads
       FROM download_tokens dt
       LEFT JOIN products pr ON pr.id = dt.product_id
       WHERE dt.created_at >= $1::timestamptz AND dt.created_at <= $2::timestamptz
       GROUP BY pr.name, dt.product_id
       ORDER BY downloads DESC
       LIMIT 10`,
      [start.toISOString(), end.toISOString()],
    ),
  ]);
  return {
    ...summary,
    topSelling: topSelling.rows.map((r) => ({ ...r, revenue: Number(r.revenue) })),
    mostDownloaded: mostDownloaded.rows,
  };
}

// ─── Customers ─────────────────────────────────────────────────────────────

export async function getCustomersSummary(start: Date, end: Date): Promise<CustomersBreakdown> {
  const result = await query<{
    total: number;
    verified: number;
    unverified: number;
    oauth: number;
    newc: number;
    returning: number;
  }>(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE email_verified = true)::int AS verified,
      COUNT(*) FILTER (WHERE email_verified = false)::int AS unverified,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM account a WHERE a.user_id = users.id AND a.provider_id <> 'credential'
      ))::int AS oauth,
      COUNT(*) FILTER (WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz)::int AS newc,
      COUNT(*) FILTER (WHERE (
        SELECT COUNT(*) FROM purchases p WHERE p.user_id = users.id AND p.status = 'paid'
      ) >= 2)::int AS returning
    FROM users
    WHERE role = 'customer'`,
    [start.toISOString(), end.toISOString()],
  );
  const row = result.rows[0];
  return {
    total: row.total,
    verified: row.verified,
    unverified: row.unverified,
    oauth: row.oauth,
    newCustomers: row.newc,
    returning: row.returning,
  };
}

export async function getCustomersAnalytics(start: Date, end: Date, bucket: Bucket): Promise<CustomersAnalytics> {
  const [summary, trend] = await Promise.all([
    getCustomersSummary(start, end),
    fetchSeries({
      table: 'users',
      dateColumn: 'created_at',
      bucket,
      start,
      end,
      agg: `COUNT(t.id)::int`,
      where: `t.role = 'customer'`,
    }),
  ]);
  return { ...summary, trend };
}

// ─── Emails ────────────────────────────────────────────────────────────────

export async function getEmailsSummary(start: Date, end: Date): Promise<EmailsBreakdown> {
  const result = await query<{ sent: number; failed: number; queued: number }>(
    `SELECT
      COUNT(*) FILTER (WHERE status IN ('sent', 'logged'))::int AS sent,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE status IN ('queued', 'retrying'))::int AS queued
    FROM email_logs
    WHERE sent_at >= $1::timestamptz AND sent_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  const row = result.rows[0];
  const delivered = row.sent + row.failed + row.queued;
  const successRate = delivered > 0 ? Math.round((row.sent / delivered) * 1000) / 10 : 0;
  return { sent: row.sent, failed: row.failed, queued: row.queued, successRate };
}

export async function getEmailsAnalytics(start: Date, end: Date, bucket: Bucket): Promise<EmailsAnalytics> {
  const [summary, daily, byType] = await Promise.all([
    getEmailsSummary(start, end),
    fetchSeries({
      table: 'email_logs',
      dateColumn: 'sent_at',
      bucket,
      start,
      end,
      agg: `COUNT(t.id)::int`,
    }),
    query<EmailTypeCount>(
      `SELECT template AS type, COUNT(*)::int AS count
       FROM email_logs
       WHERE sent_at >= $1::timestamptz AND sent_at <= $2::timestamptz
       GROUP BY template
       ORDER BY count DESC`,
      [start.toISOString(), end.toISOString()],
    ),
  ]);
  return { ...summary, daily, byType: byType.rows };
}

// ─── Traffic (internal only) ───────────────────────────────────────────────

async function countInRange(table: string, column: string, start: Date, end: Date): Promise<number> {
  const result = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM ${table} WHERE ${column} >= $1::timestamptz AND ${column} <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  return result.rows[0].c;
}

export async function getTrafficAnalytics(start: Date, end: Date): Promise<TrafficAnalytics> {
  const [purchases, downloads, contacts, feedback, newsletter, careers, logins] = await Promise.all([
    countInRange('purchases', 'created_at', start, end),
    countInRange('download_tokens', 'created_at', start, end),
    countInRange('contact_messages', 'created_at', start, end),
    countInRange('feedback', 'created_at', start, end),
    countInRange('newsletter_subscribers', 'created_at', start, end),
    countInRange('career_applications', 'created_at', start, end),
    countInRange('session', 'created_at', start, end),
  ]);
  return {
    purchases,
    downloads,
    contacts,
    feedback,
    newsletter,
    careers,
    logins,
    byCategory: [
      { category: 'Purchases', count: purchases },
      { category: 'Downloads', count: downloads },
      { category: 'Contacts', count: contacts },
      { category: 'Feedback', count: feedback },
      { category: 'Newsletter', count: newsletter },
      { category: 'Careers', count: careers },
      { category: 'Logins', count: logins },
    ],
  };
}

// ─── Growth (current vs previous period) ───────────────────────────────────

function delta(current: number, previous: number): GrowthMetric {
  const deltaPct = previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : current > 0 ? 100 : 0;
  return { current, previous, deltaPct };
}

async function sumRevenue(start: Date, end: Date): Promise<number> {
  const result = await query<{ v: number }>(
    `SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::numeric / 100.0 AS v
     FROM purchases WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  return Number(result.rows[0].v);
}

async function countOrders(start: Date, end: Date): Promise<number> {
  const result = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM purchases WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  return result.rows[0].c;
}

async function countNewCustomers(start: Date, end: Date): Promise<number> {
  const result = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM users WHERE role = 'customer' AND created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  return result.rows[0].c;
}

async function countDownloads(start: Date, end: Date): Promise<number> {
  const result = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM download_tokens WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz`,
    [start.toISOString(), end.toISOString()],
  );
  return result.rows[0].c;
}

export async function getGrowthAnalytics(
  curStart: Date,
  curEnd: Date,
  prevStart: Date,
  prevEnd: Date,
): Promise<GrowthAnalytics> {
  const [revCur, revPrev, ordCur, ordPrev, custCur, custPrev, dlCur, dlPrev] = await Promise.all([
    sumRevenue(curStart, curEnd),
    sumRevenue(prevStart, prevEnd),
    countOrders(curStart, curEnd),
    countOrders(prevStart, prevEnd),
    countNewCustomers(curStart, curEnd),
    countNewCustomers(prevStart, prevEnd),
    countDownloads(curStart, curEnd),
    countDownloads(prevStart, prevEnd),
  ]);
  return {
    revenue: delta(revCur, revPrev),
    customers: delta(custCur, custPrev),
    orders: delta(ordCur, ordPrev),
    downloads: delta(dlCur, dlPrev),
  };
}
