import { query } from '../../db.js';
import type { EmailLogRecord } from '../../email/log-repository.js';
import type { EmailListParams, EmailStats } from './types.js';

function buildWhere(params: EmailListParams): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(
      recipient ILIKE $${idx}
      OR template ILIKE $${idx}
      OR metadata->>'subject' ILIKE $${idx}
    )`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status) {
    conditions.push(`status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  if (params.template) {
    conditions.push(`template = $${idx}`);
    values.push(params.template);
    idx++;
  }

  if (params.provider) {
    conditions.push(`provider = $${idx}`);
    values.push(params.provider);
    idx++;
  }

  if (params.dateFrom) {
    conditions.push(`sent_at >= $${idx}`);
    values.push(params.dateFrom);
    idx++;
  }

  if (params.dateTo) {
    conditions.push(`sent_at <= $${idx}`);
    values.push(params.dateTo);
    idx++;
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

export async function listEmailLogs(params: EmailListParams): Promise<{ emails: EmailLogRecord[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const { clause, values } = buildWhere(params);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM email_logs ${clause}`,
    values,
  );
  const total = countResult.rows[0].count;

  const orderBy = sort === 'oldest' ? 'sent_at ASC' : 'sent_at DESC';
  const listValues = [...values, perPage, offset];

  const result = await query<EmailLogRecord>(
    `SELECT * FROM email_logs ${clause} ORDER BY ${orderBy} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );

  return { emails: result.rows, total };
}

export async function getEmailLogById(id: string): Promise<EmailLogRecord | null> {
  const result = await query<EmailLogRecord>(
    `SELECT * FROM email_logs WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getEmailStats(): Promise<EmailStats> {
  const result = await query<{ status: string; count: number }>(
    `SELECT status, COUNT(*)::int AS count FROM email_logs GROUP BY status`,
  );
  const byStatus: Record<string, number> = {};
  for (const row of result.rows) byStatus[row.status] = row.count;

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const sent = byStatus['sent'] ?? 0;
  const failed = byStatus['failed'] ?? 0;
  const logged = byStatus['logged'] ?? 0;
  const skipped = byStatus['skipped'] ?? 0;

  const recent = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM email_logs WHERE sent_at >= NOW() - INTERVAL '24 hours'`,
  );
  const last24h = recent.rows[0]?.count ?? 0;

  const successRate = total > 0 ? Math.round((sent / total) * 1000) / 10 : 0;

  return {
    total,
    sent,
    failed,
    logged,
    skipped,
    queued: 0,
    retrying: 0,
    successRate,
    last24h,
  };
}

export async function getLastSuccessAt(): Promise<string | null> {
  const result = await query<{ sent_at: Date }>(
    `SELECT sent_at FROM email_logs WHERE status = 'sent' ORDER BY sent_at DESC LIMIT 1`,
  );
  return result.rows[0]?.sent_at?.toISOString() ?? null;
}

export async function getLastFailureAt(): Promise<string | null> {
  const result = await query<{ sent_at: Date }>(
    `SELECT sent_at FROM email_logs WHERE status = 'failed' ORDER BY sent_at DESC LIMIT 1`,
  );
  return result.rows[0]?.sent_at?.toISOString() ?? null;
}
