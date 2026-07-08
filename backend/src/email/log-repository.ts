import { query } from '../db.js';

export interface EmailLogRecord {
  id: string;
  recipient: string;
  template: string;
  provider: string;
  provider_id: string | null;
  status: string;
  error: string | null;
  sent_at: Date;
  metadata: Record<string, unknown>;
}

export async function insertEmailLog(
  recipient: string,
  template: string,
  provider: string,
  providerId: string | null,
  status: string,
  error: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await query(
    `INSERT INTO email_logs (recipient, template, provider, provider_id, status, error, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [recipient, template, provider, providerId, status, error, metadata ?? {}],
  );
}
