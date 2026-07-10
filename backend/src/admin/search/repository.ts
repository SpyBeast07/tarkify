import { query } from '../../db.js';
import type { SearchModule, SearchResult } from './types.js';

// ─── Relevance / match SQL builders ─────────────────────────────────────────
// `expr` is a controlled SQL expression (never user input); `$1` is the escaped
// search term, fully parameterized.

interface Col {
  expr: string;
  field: string;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function whereClause(cols: Col[]): string {
  return cols.map((c) => `${c.expr} ILIKE '%' || $1 || '%' ESCAPE '\\'`).join(' OR ');
}

function relevanceExpr(cols: Col[]): string {
  const parts = cols.map(
    (c) =>
      `CASE WHEN lower(${c.expr}) = lower($1) THEN 3 WHEN lower(${c.expr}) LIKE lower($1) || '%' ESCAPE '\\' THEN 2 WHEN ${c.expr} ILIKE '%' || $1 || '%' ESCAPE '\\' THEN 1 ELSE 0 END`
  );
  return parts.length ? `GREATEST(${parts.join(', ')})` : '0';
}

function matchedFieldExpr(cols: Col[]): string {
  const parts = cols.map((c) => `WHEN ${c.expr} ILIKE '%' || $1 || '%' ESCAPE '\\' THEN '${c.field}'`);
  return `CASE ${parts.join(' ')} ELSE '' END`;
}

function matchedTextExpr(cols: Col[]): string {
  const parts = cols.map((c) => `WHEN ${c.expr} ILIKE '%' || $1 || '%' ESCAPE '\\' THEN ${c.expr}`);
  return `CASE ${parts.join(' ')} ELSE '' END`;
}

interface RawRow {
  id: string;
  module: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  matched_field: string;
  matched_text: string;
  relevance: string | number;
  timestamp: Date | string;
  target_url: string;
}

function mapRow(r: RawRow): SearchResult {
  return {
    id: r.id,
    module: r.module as SearchModule,
    title: r.title,
    subtitle: r.subtitle ?? '',
    description: r.description ?? '',
    matchedField: r.matched_field,
    matchedText: r.matched_text,
    relevance: Number(r.relevance),
    timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
    targetUrl: r.target_url
  };
}

function runSearch(sql: string, q: string): Promise<SearchResult[]> {
  return query<RawRow>(sql, [escapeLike(q)]).then((res) => res.rows.map(mapRow));
}

// ─── Per-module queries (parallelizable) ────────────────────────────────────

const PRODUCT_COLS: Col[] = [
  { expr: 'name', field: 'name' },
  { expr: 'slug', field: 'slug' },
  { expr: 'description', field: 'description' }
];

export function searchProducts(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'products' AS module,
      name AS title,
      COALESCE(slug, '') AS subtitle,
      COALESCE(description, '') AS description,
      ${matchedFieldExpr(PRODUCT_COLS)} AS matched_field,
      ${matchedTextExpr(PRODUCT_COLS)} AS matched_text,
      ${relevanceExpr(PRODUCT_COLS)} AS relevance,
      created_at AS timestamp,
      '/admin/products/' || id AS target_url
    FROM products
    WHERE ${whereClause(PRODUCT_COLS)}
    ORDER BY relevance DESC, created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const ORDER_COLS: Col[] = [
  { expr: 'p.razorpay_order_id', field: 'razorpay_order_id' },
  { expr: 'p.razorpay_payment_id', field: 'razorpay_payment_id' },
  { expr: 'pr.name', field: 'product' },
  { expr: "COALESCE(u.email, p.guest_email)", field: 'customer_email' }
];

export function searchOrders(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      p.id,
      'orders' AS module,
      COALESCE(pr.name, 'Order') AS title,
      COALESCE(u.email, p.guest_email, '') AS subtitle,
      'Receipt ' || COALESCE(p.razorpay_payment_id, p.razorpay_order_id) AS description,
      ${matchedFieldExpr(ORDER_COLS)} AS matched_field,
      ${matchedTextExpr(ORDER_COLS)} AS matched_text,
      ${relevanceExpr(ORDER_COLS)} AS relevance,
      p.created_at AS timestamp,
      '/admin/orders/' || p.id AS target_url
    FROM purchases p
    LEFT JOIN products pr ON pr.id = p.product_id
    LEFT JOIN users u ON u.id = p.user_id
    WHERE ${whereClause(ORDER_COLS)}
    ORDER BY relevance DESC, p.created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const CUSTOMER_COLS: Col[] = [
  { expr: 'email', field: 'email' },
  { expr: 'display_name', field: 'display_name' },
  { expr: 'name', field: 'name' },
  { expr: 'role', field: 'role' }
];

export function searchCustomers(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'customers' AS module,
      COALESCE(display_name, name, email) AS title,
      COALESCE(role, '') AS subtitle,
      email AS description,
      ${matchedFieldExpr(CUSTOMER_COLS)} AS matched_field,
      ${matchedTextExpr(CUSTOMER_COLS)} AS matched_text,
      ${relevanceExpr(CUSTOMER_COLS)} AS relevance,
      created_at AS timestamp,
      '/admin/customers/' || id AS target_url
    FROM users
    WHERE ${whereClause(CUSTOMER_COLS)}
    ORDER BY relevance DESC, created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const EMAIL_COLS: Col[] = [
  { expr: 'recipient', field: 'recipient' },
  { expr: 'template', field: 'template' },
  { expr: 'status', field: 'status' },
  { expr: "metadata->>'subject'", field: 'subject' }
];

export function searchEmails(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'emails' AS module,
      recipient AS title,
      template AS subtitle,
      status AS description,
      ${matchedFieldExpr(EMAIL_COLS)} AS matched_field,
      ${matchedTextExpr(EMAIL_COLS)} AS matched_text,
      ${relevanceExpr(EMAIL_COLS)} AS relevance,
      sent_at AS timestamp,
      '/admin/email' AS target_url
    FROM email_logs
    WHERE ${whereClause(EMAIL_COLS)}
    ORDER BY relevance DESC, sent_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const CONTACT_COLS: Col[] = [
  { expr: 'name', field: 'name' },
  { expr: 'email', field: 'email' },
  { expr: 'subject', field: 'subject' },
  { expr: 'message', field: 'message' }
];

export function searchContact(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'contact' AS module,
      name AS title,
      email AS subtitle,
      subject AS description,
      ${matchedFieldExpr(CONTACT_COLS)} AS matched_field,
      ${matchedTextExpr(CONTACT_COLS)} AS matched_text,
      ${relevanceExpr(CONTACT_COLS)} AS relevance,
      created_at AS timestamp,
      '/admin/communication/contact/' || id AS target_url
    FROM contact_messages
    WHERE ${whereClause(CONTACT_COLS)}
    ORDER BY relevance DESC, created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const FEEDBACK_COLS: Col[] = [
  { expr: 'name', field: 'name' },
  { expr: 'email', field: 'email' },
  { expr: 'product', field: 'product' },
  { expr: 'message', field: 'message' }
];

export function searchFeedback(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'feedback' AS module,
      COALESCE(name, 'Feedback') AS title,
      product AS subtitle,
      message AS description,
      ${matchedFieldExpr(FEEDBACK_COLS)} AS matched_field,
      ${matchedTextExpr(FEEDBACK_COLS)} AS matched_text,
      ${relevanceExpr(FEEDBACK_COLS)} AS relevance,
      created_at AS timestamp,
      '/admin/communication/feedback/' || id AS target_url
    FROM feedback
    WHERE ${whereClause(FEEDBACK_COLS)}
    ORDER BY relevance DESC, created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const NEWSLETTER_COLS: Col[] = [{ expr: 'email', field: 'email' }];

export function searchNewsletter(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'newsletter' AS module,
      email AS title,
      'Subscriber' AS subtitle,
      email AS description,
      ${matchedFieldExpr(NEWSLETTER_COLS)} AS matched_field,
      ${matchedTextExpr(NEWSLETTER_COLS)} AS matched_text,
      ${relevanceExpr(NEWSLETTER_COLS)} AS relevance,
      created_at AS timestamp,
      '/admin/communication/newsletter/' || id AS target_url
    FROM newsletter_subscribers
    WHERE ${whereClause(NEWSLETTER_COLS)}
    ORDER BY relevance DESC, created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const CAREER_COLS: Col[] = [
  { expr: 'name', field: 'name' },
  { expr: 'email', field: 'email' },
  { expr: "metadata->>'position'", field: 'position' }
];

export function searchCareers(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      id,
      'careers' AS module,
      name AS title,
      email AS subtitle,
      email AS description,
      ${matchedFieldExpr(CAREER_COLS)} AS matched_field,
      ${matchedTextExpr(CAREER_COLS)} AS matched_text,
      ${relevanceExpr(CAREER_COLS)} AS relevance,
      created_at AS timestamp,
      '/admin/communication/careers/' || id AS target_url
    FROM career_applications
    WHERE ${whereClause(CAREER_COLS)}
    ORDER BY relevance DESC, created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

const AUDIT_COLS: Col[] = [
  { expr: 'a.event', field: 'event' },
  { expr: 'u.email', field: 'actor' },
  { expr: "a.metadata->>'target'", field: 'target' },
  { expr: "a.metadata->>'request_id'", field: 'request_id' }
];

export function searchAudit(q: string): Promise<SearchResult[]> {
  const sql = `
    SELECT
      a.id,
      'audit' AS module,
      a.event AS title,
      COALESCE(u.email, 'system') AS subtitle,
      a.event AS description,
      ${matchedFieldExpr(AUDIT_COLS)} AS matched_field,
      ${matchedTextExpr(AUDIT_COLS)} AS matched_text,
      ${relevanceExpr(AUDIT_COLS)} AS relevance,
      a.created_at AS timestamp,
      '/admin/audit/' || a.id AS target_url
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE ${whereClause(AUDIT_COLS)}
    ORDER BY relevance DESC, a.created_at DESC
    LIMIT 100`;
  return runSearch(sql, q);
}

export const MODULE_SEARCHERS: Record<SearchModule, (q: string) => Promise<SearchResult[]>> = {
  products: searchProducts,
  orders: searchOrders,
  customers: searchCustomers,
  emails: searchEmails,
  contact: searchContact,
  feedback: searchFeedback,
  newsletter: searchNewsletter,
  careers: searchCareers,
  audit: searchAudit
};
