import { query } from '../../db.js';
import type { RecentOrder, RecentContact, RecentFeedback, RecentCareer, RecentEmail, RecentActivity } from './types.js';

export async function getRevenueSummary() {
  const result = await query(`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::int AS total,
      COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_orders,
      COUNT(*) FILTER (WHERE status = 'created')::int AS pending_payments,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_payments
    FROM purchases
  `);
  return result.rows[0] as { total: number; paid_orders: number; pending_payments: number; failed_payments: number };
}

export async function getOrdersCount() {
  const result = await query(`SELECT COUNT(*)::int AS total FROM purchases`);
  return result.rows[0] as { total: number };
}

export async function getCustomerSummary() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE email_verified = true)::int AS verified,
      COUNT(*) FILTER (WHERE email_verified = false)::int AS unverified,
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP))::int AS new_this_month
    FROM users WHERE role = 'customer'
  `);
  return result.rows[0] as { total: number; verified: number; unverified: number; new_this_month: number };
}

export async function getDownloadsSummary() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE expires_at > NOW())::int AS active_tokens,
      COUNT(*) FILTER (WHERE expires_at <= NOW())::int AS expired_tokens,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today
    FROM download_tokens
  `);
  return result.rows[0] as { total: number; active_tokens: number; expired_tokens: number; today: number };
}

export async function getProductsSummary() {
  const result = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE status IN ('draft', 'archived'))::int AS inactive
    FROM products
  `);
  const latest = await query(`
    SELECT id, name, slug, created_at FROM products ORDER BY created_at DESC LIMIT 1
  `);
  return {
    ...(result.rows[0] as { published: number; inactive: number }),
    latest: latest.rows[0] as { id: string; name: string; slug: string; created_at: string } | undefined,
  };
}

export async function getRecentOrders(limit: number = 5) {
  const result = await query<RecentOrder>(`
    SELECT
      p.id,
      u.name AS customer,
      COALESCE(u.email, p.guest_email) AS email,
      pr.name AS product,
      p.amount,
      p.status,
      p.created_at
    FROM purchases p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.id = p.product_id
    ORDER BY p.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function getRecentContacts(limit: number = 5) {
  const result = await query<RecentContact>(`
    SELECT id, name, subject, status, created_at
    FROM contact_messages
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function getRecentFeedback(limit: number = 5) {
  const result = await query<RecentFeedback>(`
    SELECT id, name, product, rating, status, created_at
    FROM feedback
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function getRecentCareers(limit: number = 5) {
  const result = await query<RecentCareer>(`
    SELECT id, name, email, status, created_at
    FROM career_applications
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function getRecentEmails(limit: number = 5) {
  const result = await query<RecentEmail>(`
    SELECT id, recipient, template, status, sent_at
    FROM email_logs
    ORDER BY sent_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function getRecentActivity(limit: number = 10) {
  const result = await query<RecentActivity>(`
    SELECT
      a.id,
      a.event,
      a.user_id,
      u.name AS user_name,
      a.metadata,
      a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
