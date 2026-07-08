import { z } from 'zod';
import { ROLES, ACCOUNT_STATUSES } from './types.js';

const TIMEZONE_REGEX = /^[A-Za-z_]+(?:\/[A-Za-z_]+)?$/;

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name must be at least 1 character')
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
  timezone: z
    .string()
    .regex(TIMEZONE_REGEX, 'Timezone must be in IANA format (e.g., America/New_York, Asia/Kolkata, UTC)')
    .optional(),
});

const emailPreferencesSchema = z.object({
  marketing: z.boolean(),
  newsletter: z.boolean(),
  product: z.boolean(),
  security: z.literal(true),
  billing: z.boolean(),
});

export const preferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    locale: z.string().min(2).max(10).optional(),
    emailNotifications: z.boolean().optional(),
    email: emailPreferencesSchema.optional(),
  })
  .catch({})
  .default({});

export const roleSchema = z.enum(ROLES);
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);

export function validateTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
