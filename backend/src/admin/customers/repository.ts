import { query } from '../../db.js';
import type {
  AccountStatus,
  CustomerListItem,
  CustomerDetail,
  CustomerListParams,
  CustomerSession,
  CustomerPurchase,
  CustomerDownload,
  CustomerAuditEntry,
  CustomerActivityEntry,
  OAuthAccountInfo,
} from './types.js';

function buildListWhere(params: CustomerListParams): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(
      u.name ILIKE $${idx}
      OR u.email ILIKE $${idx}
      OR u.display_name ILIKE $${idx}
    )`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status) {
    conditions.push(`u.account_status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  if (params.emailVerified !== undefined) {
    conditions.push(`u.email_verified = $${idx}`);
    values.push(params.emailVerified);
    idx++;
  }

  if (params.oauth) {
    if (params.oauth === 'none') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM account a WHERE a.user_id = u.id AND a.provider_id != 'credential')`);
    } else {
      conditions.push(`EXISTS (SELECT 1 FROM account a WHERE a.user_id = u.id AND a.provider_id = $${idx})`);
      values.push(params.oauth);
      idx++;
    }
  }

  if (params.dateFrom) {
    conditions.push(`u.created_at >= $${idx}::timestamptz`);
    values.push(params.dateFrom);
    idx++;
  }

  if (params.dateTo) {
    conditions.push(`u.created_at <= $${idx}::timestamptz`);
    values.push(params.dateTo);
    idx++;
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

function buildOrderBy(sort: string): string {
  switch (sort) {
    case 'oldest': return 'u.created_at ASC';
    case 'name': return 'COALESCE(u.display_name, u.name, u.email) ASC';
    case 'last_login': return 'u.last_login_at DESC NULLS LAST';
    case 'purchases': return 'purchase_count DESC, u.created_at DESC';
    default: return 'u.created_at DESC';
  }
}

export async function listCustomers(params: CustomerListParams): Promise<{ customers: CustomerListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;

  const { clause, values } = buildListWhere(params);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM users u
     WHERE u.role = 'customer'
     ${clause ? `AND ${clause.slice('WHERE '.length)}` : ''}`,
    values.length > 0 ? values : undefined,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const baseParams = values.length > 0 ? [...values] : [];
  const listValues = [...baseParams, perPage, offset];
  const clauseForList = clause ? clause : 'WHERE u.role = \'customer\'';

  const result = await query<{
    id: string; name: string | null; email: string;
    display_name: string | null; image: string | null;
    account_status: AccountStatus; email_verified: boolean;
    last_login_at: string | null; created_at: string;
    oauth_providers: string; purchases_count: number; downloads_count: number;
  }>(
    `SELECT
      u.id, u.name, u.email, u.display_name, u.image,
      u.account_status, u.email_verified,
      u.last_login_at, u.created_at,
      COALESCE(
        (SELECT string_agg(DISTINCT a.provider_id, ',' ORDER BY a.provider_id)
         FROM account a WHERE a.user_id = u.id),
        ''
      ) AS oauth_providers,
      (SELECT COUNT(*) FROM purchases p WHERE p.user_id = u.id)::int AS purchases_count,
      (SELECT COUNT(*) FROM download_tokens dt
       JOIN purchases p ON p.id = dt.purchase_id
       WHERE p.user_id = u.id)::int AS downloads_count
    FROM users u
    ${clauseForList}
    ORDER BY ${orderBy}
    LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
    listValues,
  );

  const customers = result.rows.map(row => ({
    ...row,
    oauth_providers: row.oauth_providers ? row.oauth_providers.split(',').filter(Boolean) : [],
  }));

  return { customers, total };
}

export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const result = await query<{
    id: string; email: string; name: string | null;
    display_name: string | null; image: string | null;
    timezone: string | null; preferences: string;
    role: string; account_status: AccountStatus;
    email_verified: boolean; last_login_at: string | null;
    last_activity_at: string | null; created_at: string; updated_at: string;
  }>(
    `SELECT
      id, email, name, display_name, image,
      timezone, preferences, role, account_status,
      email_verified, last_login_at, last_activity_at,
      created_at, updated_at
    FROM users
    WHERE id = $1 AND role = 'customer'`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;

  const oauthResult = await query<OAuthAccountInfo>(
    `SELECT provider_id, account_id, created_at
     FROM account WHERE user_id = $1
     ORDER BY created_at ASC`,
    [id],
  );

  const passwordResult = await query<{ password: string | null }>(
    `SELECT password FROM account
     WHERE user_id = $1 AND provider_id = 'credential'`,
    [id],
  );

  return {
    ...row,
    preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences) : row.preferences,
    has_password: passwordResult.rows.length > 0 && passwordResult.rows[0].password !== null,
    oauth_accounts: oauthResult.rows,
  } as CustomerDetail;
}

export async function getCustomerPurchases(userId: string): Promise<CustomerPurchase[]> {
  const result = await query<CustomerPurchase>(
    `SELECT
      p.id, pr.name AS product_name, pr.slug AS product_slug,
      p.amount, p.currency, p.status, p.created_at
    FROM purchases p
    LEFT JOIN products pr ON pr.id = p.product_id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
    LIMIT 50`,
    [userId],
  );
  return result.rows;
}

export async function getCustomerDownloads(userId: string): Promise<CustomerDownload[]> {
  const result = await query<CustomerDownload>(
    `SELECT
      dt.id, dt.token, dt.purchase_id,
      pr.name AS product_name,
      dt.expires_at, dt.created_at
    FROM download_tokens dt
    JOIN purchases p ON p.id = dt.purchase_id
    LEFT JOIN products pr ON pr.id = dt.product_id
    WHERE p.user_id = $1
    ORDER BY dt.created_at DESC
    LIMIT 50`,
    [userId],
  );
  return result.rows;
}

export async function getCustomerSessions(userId: string): Promise<CustomerSession[]> {
  const result = await query<CustomerSession>(
    `SELECT
      id, user_id, token, ip_address, user_agent,
      device_name, device_type, browser, os,
      created_at, expires_at, last_seen
    FROM session
    WHERE user_id = $1
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 50`,
    [userId],
  );
  return result.rows;
}

export async function getRecentActivity(userId: string): Promise<CustomerActivityEntry[]> {
  const result = await query<CustomerActivityEntry>(
    `SELECT
      id, event, metadata, created_at
    FROM audit_logs
    WHERE user_id = $1
      AND event IN ('login', 'logout', 'account_created', 'email_verified',
                     'password_changed', 'password_reset', 'payment_captured')
    ORDER BY created_at DESC
    LIMIT 20`,
    [userId],
  );
  return result.rows;
}

export async function getCustomerAuditLog(userId: string): Promise<CustomerAuditEntry[]> {
  const result = await query<CustomerAuditEntry>(
    `SELECT
      a.id, a.event, a.user_id, u.name AS user_name,
      a.metadata, a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.metadata->>'target_user_id' = $1
       OR (a.event IN ('account_suspended', 'account_reactivated', 'account_deleted',
                       'verification_resent', 'password_reset_requested',
                       'customer_sessions_revoked')
           AND a.metadata->>'target_user_id' = $1)
    ORDER BY a.created_at DESC
    LIMIT 100`,
    [userId],
  );
  return result.rows;
}

export async function updateAccountStatus(
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED',
): Promise<void> {
  await query(
    'UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2 AND role = \'customer\'',
    [status, userId],
  );
}

export async function deleteSessionsByUserId(userId: string): Promise<number> {
  const result = await query(
    'DELETE FROM session WHERE user_id = $1',
    [userId],
  );
  return result.rowCount ?? 0;
}

export async function getSessionTokenById(sessionId: string): Promise<string | null> {
  const result = await query<{ token: string }>(
    'SELECT token FROM session WHERE id = $1',
    [sessionId],
  );
  return result.rows[0]?.token ?? null;
}

export async function getFilterOptions(): Promise<{ statuses: string[] }> {
  const result = await query<{ status: string }>(
    `SELECT DISTINCT account_status AS status
     FROM users WHERE role = 'customer'
     ORDER BY status ASC`,
  );
  return { statuses: result.rows.map(r => r.status) };
}
