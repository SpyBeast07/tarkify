import { z } from 'zod';
import { AUDIT_MODULES } from './types.js';

const uuidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const auditListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  event: z.string().trim().max(120).optional(),
  module: z.enum(AUDIT_MODULES as [string, ...string[]]).optional(),
  status: z.enum(['success', 'failed']).optional(),
  actor: z.string().trim().max(200).optional(),
  target: z.string().trim().max(200).optional(),
  dateFrom: z.string().trim().max(40).optional(),
  dateTo: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum(['newest', 'oldest', 'event', 'module', 'actor']).optional().default('newest')
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;

export function isUuid(value: string): boolean {
  return uuidLike.test(value);
}
