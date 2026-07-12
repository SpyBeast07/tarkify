import { z } from 'zod';
import type { SettingsGroup, SettingsValueMap } from './types.js';

// ─── Per-group schemas ──────────────────────────────────────────────────────

export const paymentsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  taxEnabled: z.boolean().default(false),
});

export const notificationsSchema = z.object({
  adminEmailAlerts: z.boolean().default(true),
  paymentAlerts: z.boolean().default(true),
  feedbackAlerts: z.boolean().default(true),
  contactAlerts: z.boolean().default(true),
  careerAlerts: z.boolean().default(true),
  newsletterAlerts: z.boolean().default(true),
  systemAlerts: z.boolean().default(true),
});

export const groupSchemas: Record<SettingsGroup, z.ZodTypeAny> = {
  payments: paymentsSchema,
  notifications: notificationsSchema,
};

export type GroupSchema = typeof groupSchemas;

export function parseGroup<K extends SettingsGroup>(
  group: K,
  data: unknown
): SettingsValueMap[K] {
  const schema = groupSchemas[group];
  return schema.parse(data) as SettingsValueMap[K];
}
