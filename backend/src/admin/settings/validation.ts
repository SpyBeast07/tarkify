import { z } from 'zod';
import type { SettingsGroup, SettingsValueMap } from './types.js';

// ─── Reusable validators ────────────────────────────────────────────────────

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const urlOrEmpty = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .refine((val) => val === '' || /^https?:\/\/.+/.test(val), 'Enter a valid http(s) URL')
  .default('');

const requiredEmail = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(254, 'Email is too long');

const requiredColor = z
  .string()
  .trim()
  .regex(HEX_COLOR, 'Enter a valid hex color (e.g. #7b904b)');

const shortText = (max = 200) => z.string().trim().max(max, `Must be at most ${max} characters`);

const socialLinkSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(60, 'Label is too long'),
  url: urlOrEmpty,
});

// ─── Per-group schemas ──────────────────────────────────────────────────────

export const brandSchema = z.object({
  logoUrl: urlOrEmpty,
  faviconUrl: urlOrEmpty,
  primaryColor: requiredColor,
  secondaryColor: requiredColor,
  companyDescription: shortText(1000),
  socialLinks: z.array(socialLinkSchema).max(20, 'Too many social links').default([]),
});

export const emailSchema = z.object({
  defaultFromName: z.string().trim().min(1, 'From name is required').max(120, 'Name is too long'),
  replyToName: z.string().trim().min(1, 'Reply-To name is required').max(120, 'Name is too long'),
  adminNotificationEmail: requiredEmail,
  emailFooter: shortText(500),
  signature: shortText(500),
  enableEmailSending: z.boolean().default(true),
  enableTestEmails: z.boolean().default(false),
});

export const paymentsSchema = z.object({
  enablePayments: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
  acceptedCurrency: z.string().trim().min(3, 'Currency code is required').max(3, 'Use a 3-letter ISO code'),
  taxEnabled: z.boolean().default(false),
  receiptPrefix: z.string().trim().min(1, 'Receipt prefix is required').max(20, 'Prefix is too long'),
});

export const oauthSchema = z.object({
  enableGoogleLogin: z.boolean().default(false),
  enableAccountLinking: z.boolean().default(true),
  allowEmailSignup: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
});

export const securitySchema = z.object({
  passwordPolicy: z.enum(['low', 'medium', 'high', 'custom']),
  minimumLength: z.number().int().min(6, 'Minimum length is 6').max(128, 'Maximum length is 128'),
  requireNumbers: z.boolean().default(false),
  requireSymbols: z.boolean().default(false),
  sessionTimeout: z.number().int().min(5, 'Minimum timeout is 5 minutes').max(1440, 'Maximum timeout is 1440 minutes'),
  maximumSessions: z.number().int().min(1, 'At least 1 session').max(100, 'Maximum is 100 sessions'),
  accountLockout: z.boolean().default(true),
  rateLimitingEnabled: z.boolean().default(true),
});

export const storageSchema = z.object({
  storageProvider: z.string().trim().min(1).max(40).default('local'),
  maximumUploadSize: z.number().int().min(1, 'Minimum is 1 MB').max(5120, 'Maximum is 5120 MB'),
  downloadExpiry: z.number().int().min(60, 'Minimum is 60 seconds').max(86400, 'Maximum is 86400 seconds'),
  cleanupSchedule: z.enum(['daily', 'weekly', 'monthly', 'never']),
  retentionDays: z.number().int().min(1, 'Minimum is 1 day').max(3650, 'Maximum is 3650 days'),
});

export const featuresSchema = z.object({
  customerPortal: z.boolean().default(true),
  adminPortal: z.boolean().default(true),
  downloads: z.boolean().default(true),
  newsletter: z.boolean().default(true),
  feedback: z.boolean().default(true),
  careers: z.boolean().default(true),
  analytics: z.boolean().default(true),
  emailCenter: z.boolean().default(true),
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

export const seoSchema = z.object({
  siteTitle: z.string().trim().min(1, 'Site title is required').max(160, 'Title is too long'),
  defaultDescription: shortText(500),
  keywords: z.array(z.string().trim().min(1).max(60)).max(30, 'Too many keywords').default([]),
  ogTitle: shortText(160),
  ogDescription: shortText(500),
  robots: z.enum(['index,follow', 'noindex,nofollow', 'index,nofollow', 'noindex,follow']),
  canonicalUrl: urlOrEmpty,
});

export const legalSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(160, 'Name is too long'),
  companyAddress: shortText(500),
  gstNumber: z.string().trim().max(20, 'GST number is too long').default(''),
  privacyPolicyUrl: urlOrEmpty,
  termsUrl: urlOrEmpty,
  refundPolicyUrl: urlOrEmpty,
  supportUrl: urlOrEmpty,
});

export const groupSchemas: Record<SettingsGroup, z.ZodTypeAny> = {
  brand: brandSchema,
  email: emailSchema,
  payments: paymentsSchema,
  oauth: oauthSchema,
  security: securitySchema,
  storage: storageSchema,
  features: featuresSchema,
  notifications: notificationsSchema,
  seo: seoSchema,
  legal: legalSchema,
};

export type GroupSchema = typeof groupSchemas;

export function parseGroup<K extends SettingsGroup>(
  group: K,
  data: unknown
): SettingsValueMap[K] {
  const schema = groupSchemas[group];
  return schema.parse(data) as SettingsValueMap[K];
}
