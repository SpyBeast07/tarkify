import { query } from '../db.js';
import type { AuditEvent, AuditLogEntry } from './types.js';

export async function insertAuditLog(
  userId: string,
  event: AuditEvent,
  metadata: Record<string, unknown> = {},
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AuditLogEntry> {
  const result = await query<AuditLogEntry>(
    `INSERT INTO audit_logs (user_id, event, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING *`,
    [userId, event, JSON.stringify(metadata), ipAddress ?? null, userAgent ?? null]
  );
  return result.rows[0];
}
