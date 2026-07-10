import * as repo from './repository.js';
import type {
  AuditDetail,
  AuditEventRow,
  AuditListParams,
  AuditListResponse,
  AuditOptions,
  AuditStats
} from './types.js';
import { recordEvent } from '../../audit/service.js';
import type { AuditEvent } from '../../audit/types.js';

const RELATED_KEYS = [
  'target_user_id',
  'target',
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
  'actor',
  'amount',
  'currency'
];

export async function listAuditLogs(params: AuditListParams): Promise<AuditListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { events, total } = await repo.listAuditLogs(params);
  return {
    events,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage)
  };
}

export async function getAuditById(id: string): Promise<AuditDetail | null> {
  const row = await repo.getAuditById(id);
  if (!row) return null;
  const related: { key: string; value: string }[] = [];
  for (const key of RELATED_KEYS) {
    const v = row.metadata[key];
    if (v !== undefined && v !== null && v !== '') {
      related.push({ key, value: String(v) });
    }
  }
  return { ...row, relatedEntity: related };
}

export async function getStats(): Promise<AuditStats> {
  return repo.getAuditStats();
}

export async function getOptions(): Promise<AuditOptions> {
  return repo.getAuditOptions();
}

export function streamAuditRows(
  params: AuditListParams,
  chunkSize?: number
): AsyncGenerator<AuditEventRow[]> {
  return repo.streamAuditRows(params, chunkSize);
}

export async function recordAuditViewed(
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  await recordEvent(adminUserId, 'audit_log_viewed' as AuditEvent, {}, ipAddress, userAgent);
}
