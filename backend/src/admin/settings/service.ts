import * as repo from './repository.js';
import { parseGroup } from './validation.js';
import {
  DEFAULT_SETTINGS,
  SETTINGS_GROUPS,
  type AllSettings,
  type SettingsGroup,
  type SettingsValueMap,
} from './types.js';
import { recordEvent } from '../../audit/service.js';
import type { AuditEvent } from '../../audit/types.js';

type AuditMap = Record<SettingsGroup, AuditEvent>;

export const SETTINGS_AUDIT_EVENTS: AuditMap = {
  general: 'general_updated',
  brand: 'brand_updated',
  email: 'email_updated',
  payments: 'payments_updated',
  oauth: 'oauth_updated',
  security: 'security_updated',
  storage: 'storage_updated',
  features: 'features_updated',
  notifications: 'notifications_updated',
  seo: 'seo_updated',
  legal: 'legal_updated',
} as const;

function mergeDefaults<K extends SettingsGroup>(group: K, stored: Record<string, unknown> | null): SettingsValueMap[K] {
  const defaults = DEFAULT_SETTINGS[group] as unknown as Record<string, unknown>;
  if (!stored) return defaults as unknown as SettingsValueMap[K];
  return { ...defaults, ...stored } as unknown as SettingsValueMap[K];
}

export async function getAllSettings(): Promise<AllSettings> {
  const rows = await repo.getAllRows();
  const byKey = new Map(rows.map((r) => [r.key as SettingsGroup, r.value]));
  const result: Record<string, unknown> = {};
  for (const group of SETTINGS_GROUPS) {
    result[group] = mergeDefaults(group, byKey.get(group) ?? null);
  }
  return result as unknown as AllSettings;
}

export async function getSettings<K extends SettingsGroup>(group: K): Promise<SettingsValueMap[K]> {
  const stored = await repo.getValue(group);
  return mergeDefaults(group, stored);
}

export async function updateSettings<K extends SettingsGroup>(
  group: K,
  data: unknown,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<SettingsValueMap[K]> {
  const parsed = parseGroup(group, data);
  await repo.upsertValue(group, parsed as unknown as Record<string, unknown>, adminUserId);
  await recordEvent(
    adminUserId,
    SETTINGS_AUDIT_EVENTS[group],
    { group },
    ipAddress,
    userAgent,
  );
  return parsed;
}

export async function recordSettingsViewed(
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(adminUserId, 'settings_viewed', {}, ipAddress, userAgent);
}
