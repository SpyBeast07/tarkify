import { query } from '../../db.js';
import type {
  AuditActor,
  AuditEventRow,
  AuditListParams,
  AuditModule,
  AuditOptions,
  AuditStats,
  AuditStatus
} from './types.js';
import { AUDIT_MODULES } from './types.js';
import { isUuid } from './validation.js';

// ─── Derived column expressions (module / status) ───────────────────────────
// These mirror the event taxonomy defined across the app. They are derived from
// the existing `event` column so we keep a single source of truth and the
// existing audit tables unchanged.

export const MODULE_EXPR = `
  CASE
    WHEN event IN ('login','logout','session_revoked','account_created','password_changed','password_reset','email_verified','account_deleted','account_reactivated','account_suspended')
      THEN 'Authentication'
    WHEN event LIKE 'product%' THEN 'Products'
    WHEN event LIKE 'order%' THEN 'Orders'
    WHEN event LIKE 'payment%' OR event = 'receipt_viewed' THEN 'Payments'
    WHEN event LIKE 'download%' OR event IN ('token_revoked','token_regenerated') THEN 'Downloads'
    WHEN event LIKE 'customer%' OR event IN ('verification_resent','password_reset_requested','customer_sessions_revoked')
      THEN 'Customers'
    WHEN event LIKE 'contact%' OR event LIKE 'feedback%' OR event LIKE 'newsletter%' OR event LIKE 'careers%'
      OR event IN ('note_added','tag_added','tag_removed') THEN 'Communication'
    WHEN event LIKE 'email%' OR event IN ('template_viewed','provider_viewed') THEN 'Emails'
    WHEN event LIKE 'general%' OR event LIKE 'brand%' OR event LIKE 'oauth%' OR event LIKE 'security%'
      OR event LIKE 'storage%' OR event LIKE 'features%' OR event LIKE 'notifications%'
      OR event LIKE 'seo%' OR event LIKE 'legal%' OR event = 'settings_viewed' THEN 'Settings'
    WHEN event LIKE 'system%' THEN 'System'
    WHEN event LIKE 'analytics%' THEN 'Analytics'
    ELSE 'Admin'
  END
`;

export const STATUS_EXPR = `
  CASE
    WHEN metadata ? 'status' AND metadata->>'status' IN ('failed','error') THEN 'failed'
    WHEN event LIKE '%failed%' THEN 'failed'
    ELSE 'success'
  END
`;

const SELECT_COLUMNS = `
  a.id,
  a.event,
  (${MODULE_EXPR}) AS module,
  (${STATUS_EXPR}) AS status,
  a.metadata,
  a.ip_address,
  a.user_agent,
  a.created_at,
  a.user_id,
  u.email AS actor_email,
  COALESCE(u.display_name, u.name) AS actor_name
`;

interface RawAuditRow {
  id: string;
  event: string;
  module: string;
  status: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date | string;
  user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
}

// Sensitive keys that must never be surfaced, even if present in metadata.
const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'token',
  'secret',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
  'session',
  'session_token',
  'access_token',
  'refresh_token',
  'private_key',
  'resend_api_key',
  'razorpay_key_secret',
  'betTER_auth_secret'
];

const MASK = '***REDACTED***';

export function sanitizeMetadata(input: unknown): Record<string, unknown> {
  if (input === null || input === undefined) return {};
  if (typeof input !== 'object' || Array.isArray(input)) return {};

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[key] = MASK;
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = sanitizeMetadata(value);
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? sanitizeMetadata(item) : item
      );
    } else {
      out[key] = value;
    }
  }
  return out;
}

const TARGET_PRIORITY = [
  'target_user_id',
  'target',
  'user_id',
  'product_id',
  'product_slug',
  'order_id',
  'payment_id',
  'razorpay_payment_id',
  'razorpay_order_id',
  'token',
  'download_token',
  'record_id',
  'record_type',
  'email',
  'ip_address'
];

export function deriveTarget(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  for (const key of TARGET_PRIORITY) {
    const v = metadata[key];
    if (v !== undefined && v !== null && v !== '') {
      return `${key}=${String(v)}`;
    }
  }
  return null;
}

export function deriveDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  let os = 'Unknown OS';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  let browser = 'Unknown Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  return `${browser} · ${os}`;
}

export function deriveSummary(event: string, metadata: Record<string, unknown> | null): string {
  const human = event
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  if (!metadata) return human;
  const bits: string[] = [];
  const target = deriveTarget(metadata);
  if (target) bits.push(target);
  return bits.length ? `${human} (${bits.join(', ')})` : human;
}

function mapRow(row: RawAuditRow): AuditEventRow {
  const metadata = sanitizeMetadata(row.metadata);
  const actor: AuditActor | null = row.user_id
    ? {
        id: row.user_id,
        email: row.actor_email ?? '',
        name: row.actor_name
      }
    : null;
  const createdAt =
    row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);
  const requestId = (metadata.request_id as string) ?? null;

  return {
    id: row.id,
    event: row.event,
    module: row.module as AuditModule,
    status: row.status === 'failed' ? 'failed' : 'success',
    actor,
    target: deriveTarget(row.metadata),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    device: deriveDevice(row.user_agent),
    requestId,
    metadata,
    summary: deriveSummary(row.event, row.metadata),
    createdAt
  };
}

function buildWhere(params: AuditListParams): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const push = (sql: string, val: unknown) => {
    conditions.push(sql.replace(/\$(\d+)/g, `$${idx}`));
    values.push(val);
    idx++;
  };

  if (params.search) {
    const like = `%${params.search}%`;
    push(
      `(a.event ILIKE $1 OR u.email ILIKE $1 OR u.name ILIKE $1 OR a.metadata::text ILIKE $1)`,
      like
    );
  }
  if (params.event) {
    push(`a.event = $1`, params.event);
  }
  if (params.module) {
    push(`(${MODULE_EXPR}) = $1`, params.module);
  }
  if (params.status) {
    push(`(${STATUS_EXPR}) = $1`, params.status);
  }
  if (params.actor) {
    if (isUuid(params.actor)) {
      push(`a.user_id = $1`, params.actor);
    } else {
      push(`(a.user_id::text = $1 OR u.email ILIKE $2)`, params.actor);
      values.push(`%${params.actor}%`);
      idx++;
    }
  }
  if (params.target) {
    push(`a.metadata::text ILIKE $1`, `%${params.target}%`);
  }
  if (params.dateFrom) {
    push(`a.created_at >= $1::timestamptz`, params.dateFrom);
  }
  if (params.dateTo) {
    push(`a.created_at <= $1::timestamptz`, `${params.dateTo} 23:59:59`);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

function buildOrderBy(sort: AuditListParams['sort']): string {
  switch (sort) {
    case 'oldest':
      return 'a.created_at ASC';
    case 'event':
      return 'a.event ASC';
    case 'module':
      return `(${MODULE_EXPR}) ASC, a.created_at DESC`;
    case 'actor':
      return 'COALESCE(u.email, a.user_id::text) ASC, a.created_at DESC';
    default:
      return 'a.created_at DESC';
  }
}

export async function listAuditLogs(params: AuditListParams): Promise<{
  events: AuditEventRow[];
  total: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const { clause, values } = buildWhere(params);

  const dataValues = [...values, perPage, offset];
  const dataResult = await query<RawAuditRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${clause}
     ORDER BY ${buildOrderBy(params.sort)}
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    dataValues
  );

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${clause}`,
    values.length > 0 ? values : undefined
  );

  const events = dataResult.rows.map(mapRow);
  const total = countResult.rows[0]?.count ?? 0;
  return { events, total };
}

export async function getAuditById(id: string): Promise<AuditEventRow | null> {
  const result = await query<RawAuditRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.id = $1`,
    [id]
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function getAuditStats(): Promise<AuditStats> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const result = await query<{
    total: number;
    today: number;
    failed: number;
    successful: number;
    unique_admins: number;
  }>(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE a.created_at >= $1::timestamptz)::int AS today,
       COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'failed')::int AS failed,
       COUNT(*) FILTER (WHERE (${STATUS_EXPR}) = 'success')::int AS successful,
       COUNT(DISTINCT a.user_id) FILTER (WHERE u.role = 'admin')::int AS unique_admins
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id`,
    [todayStart.toISOString()]
  );
  const row = result.rows[0];
  return {
    total: row?.total ?? 0,
    today: row?.today ?? 0,
    failed: row?.failed ?? 0,
    successful: row?.successful ?? 0,
    uniqueAdmins: row?.unique_admins ?? 0
  };
}

export async function getAuditOptions(): Promise<AuditOptions> {
  const eventsResult = await query<{ event: string }>(
    `SELECT DISTINCT event FROM audit_logs ORDER BY event ASC`
  );
  const modulesResult = await query<{ module: string }>(
    `SELECT DISTINCT (${MODULE_EXPR}) AS module FROM audit_logs ORDER BY module ASC`
  );
  const actorsResult = await query<AuditActor>(
    `SELECT DISTINCT a.user_id AS id, u.email AS email, COALESCE(u.display_name, u.name) AS name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.user_id IS NOT NULL
     ORDER BY u.email ASC
     LIMIT 200`
  );

  const modules = modulesResult.rows
    .map((r) => r.module as AuditModule)
    .filter((m): m is AuditModule => AUDIT_MODULES.includes(m));

  return {
    events: eventsResult.rows.map((r) => r.event),
    modules,
    actors: actorsResult.rows,
    statuses: ['success', 'failed'] as AuditStatus[]
  };
}

// ─── Streaming (for exports) ─────────────────────────────────────────────────
// Yields filtered rows in batches so large exports never load everything into
// memory at once.

export async function* streamAuditRows(
  params: AuditListParams,
  chunkSize = 1000
): AsyncGenerator<AuditEventRow[]> {
  const { clause, values } = buildWhere(params);
  let offset = 0;
  // Hard cap to protect against runaway exports.
  const MAX_ROWS = 200_000;

  while (offset < MAX_ROWS) {
    const result = await query<RawAuditRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${clause}
       ORDER BY a.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, chunkSize, offset]
    );
    if (result.rows.length === 0) break;
    yield result.rows.map(mapRow);
    if (result.rows.length < chunkSize) break;
    offset += chunkSize;
  }
}
