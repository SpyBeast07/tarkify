import { query } from '../../db.js';
import type {
  DownloadListItem,
  DownloadDetail,
  DownloadListParams,
  DownloadHistoryEntry,
  DownloadAuditEntry,
  DownloadTokenStatus,
} from './types.js';

function tokenStatus(expiresAt: string, revoked: boolean): DownloadTokenStatus {
  if (revoked) return 'revoked';
  return new Date(expiresAt) > new Date() ? 'active' : 'expired';
}

function buildListWhere(params: DownloadListParams): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(
      COALESCE(u.name, '') ILIKE $${idx}
      OR COALESCE(u.email, p.guest_email, '') ILIKE $${idx}
      OR pr.name ILIKE $${idx}
      OR dt.token ILIKE $${idx}
    )`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status === 'active') {
    conditions.push(`dt.expires_at > NOW()`);
  } else if (params.status === 'expired') {
    conditions.push(`dt.expires_at <= NOW()`);
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
    case 'oldest': return 'dt.created_at ASC';
    case 'expires': return 'dt.expires_at ASC';
    case 'downloads': return 'tokens_count DESC, dt.created_at DESC';
    default: return 'dt.created_at DESC';
  }
}

export async function listDownloads(params: DownloadListParams): Promise<{ downloads: DownloadListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;

  const { clause, values } = buildListWhere(params);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM download_tokens dt
     LEFT JOIN purchases p ON p.id = dt.purchase_id
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN products pr ON pr.id = dt.product_id
     ${clause}`,
    values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<{
    id: string; token: string; purchase_id: string;
    product_id: string; product_name: string;
    customer_name: string | null; customer_email: string;
    created_at: string; expires_at: string;
    tokens_count: number;
  }>(
    `SELECT
      dt.id, dt.token, dt.purchase_id, dt.product_id,
      pr.name AS product_name,
      u.name AS customer_name,
      COALESCE(u.email, p.guest_email) AS customer_email,
      dt.created_at, dt.expires_at,
      (SELECT COUNT(*)::int FROM download_tokens dt2 WHERE dt2.purchase_id = dt.purchase_id) AS tokens_count
    FROM download_tokens dt
    LEFT JOIN purchases p ON p.id = dt.purchase_id
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.id = dt.product_id
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );

  const downloads = result.rows.map(row => ({
    ...row,
    status: tokenStatus(row.expires_at, false) as DownloadTokenStatus,
  }));

  return { downloads, total };
}

export async function getDownloadById(id: string): Promise<DownloadDetail | null> {
  const result = await query<{
    id: string; token: string; purchase_id: string;
    product_id: string; product_name: string; product_slug: string;
    customer_name: string | null; customer_email: string;
    customer_id: string | null;
    created_at: string; expires_at: string;
    tokens_count: number;
  }>(
    `SELECT
      dt.id, dt.token, dt.purchase_id, dt.product_id,
      pr.name AS product_name, pr.slug AS product_slug,
      u.name AS customer_name,
      COALESCE(u.email, p.guest_email) AS customer_email,
      p.user_id AS customer_id,
      dt.created_at, dt.expires_at,
      (SELECT COUNT(*)::int FROM download_tokens dt2 WHERE dt2.purchase_id = dt.purchase_id) AS token_count
    FROM download_tokens dt
    LEFT JOIN purchases p ON p.id = dt.purchase_id
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN products pr ON pr.id = dt.product_id
    WHERE dt.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    status: tokenStatus(row.expires_at, false),
  };
}

export async function getDownloadHistory(downloadTokenId: string, purchaseId: string): Promise<DownloadHistoryEntry[]> {
  const events: DownloadHistoryEntry[] = [];

  const tokenResult = await query<{ created_at: string; expires_at: string; id: string }>(
    'SELECT id, created_at, expires_at FROM download_tokens WHERE id = $1',
    [downloadTokenId],
  );
  const token = tokenResult.rows[0];
  if (!token) return [];

  events.push({
    id: `token-created-${token.id}`,
    event: 'token_generated',
    description: 'Download token generated',
    user_name: null,
    created_at: token.created_at,
  });

  const now = new Date();
  const expiresAt = new Date(token.expires_at);
  if (expiresAt <= now) {
    events.push({
      id: `token-expired-${token.id}`,
      event: 'token_expired',
      description: 'Download token expired',
      user_name: null,
      created_at: token.expires_at,
    });
  }

  const emailResult = await query<{ id: string; sent_at: string }>(
    `SELECT id, sent_at FROM email_logs
     WHERE metadata->>'purchase_id' = $1 OR metadata->>'purchaseId' = $1
     ORDER BY sent_at ASC`,
    [purchaseId],
  );
  for (const email of emailResult.rows) {
    events.push({
      id: `email-${email.id}`,
      event: 'download_email_sent',
      description: 'Download email sent',
      user_name: null,
      created_at: email.sent_at,
    });
  }

  const auditResult = await query<DownloadHistoryEntry>(
    `SELECT
      a.id,
      a.event,
      a.metadata->>'description' AS description,
      u.name AS user_name,
      a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.metadata->>'download_token_id' = $1
       OR (a.metadata->>'purchase_id' = $2 AND a.event IN ('token_revoked', 'token_regenerated'))
    ORDER BY a.created_at ASC`,
    [downloadTokenId, purchaseId],
  );
  for (const entry of auditResult.rows) {
    events.push({
      ...entry,
      description: entry.description || entry.event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    });
  }

  events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return events;
}

export async function getDownloadAuditLog(downloadTokenId: string, purchaseId: string): Promise<DownloadAuditEntry[]> {
  const result = await query<DownloadAuditEntry>(
    `SELECT
      a.id, a.event, a.user_id, u.name AS user_name,
      a.metadata, a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.metadata->>'download_token_id' = $1
       OR (a.metadata->>'purchase_id' = $2 AND a.event IN ('token_revoked', 'token_regenerated'))
    ORDER BY a.created_at DESC
    LIMIT 100`,
    [downloadTokenId, purchaseId],
  );
  return result.rows;
}

export async function revokeDownloadToken(id: string): Promise<void> {
  await query(
    `UPDATE download_tokens
     SET expires_at = NOW()
     WHERE id = $1`,
    [id],
  );
}

export async function getProductOptions(): Promise<{ id: string; name: string }[]> {
  const result = await query<{ id: string; name: string }>(
    'SELECT DISTINCT pr.id, pr.name FROM download_tokens dt JOIN products pr ON pr.id = dt.product_id ORDER BY pr.name ASC',
  );
  return result.rows;
}

export async function getPurchaseIdByTokenId(id: string): Promise<string | null> {
  const result = await query<{ purchase_id: string }>(
    'SELECT purchase_id FROM download_tokens WHERE id = $1',
    [id],
  );
  return result.rows[0]?.purchase_id ?? null;
}
