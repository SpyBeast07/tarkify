import { z } from 'zod';
import type { SettingsGroup, SettingsValueMap } from './types.js';

// ─── Per-group schemas ──────────────────────────────────────────────────────

export const paymentsSchema = z.object({
  enablePayments: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
  acceptedCurrency: z.string().trim().min(3, 'Currency code is required').max(3, 'Use a 3-letter ISO code'),
  taxEnabled: z.boolean().default(false),
  receiptPrefix: z.string().trim().min(1, 'Receipt prefix is required').max(20, 'Prefix is too long'),
});

export const notificationsSchema = z.object({
  adminEmailAlerts: z.boolean().default(true),
  paymentAlerts: z.boolean().default(true),
  downloadAlerts: z.boolean().default(true),
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
