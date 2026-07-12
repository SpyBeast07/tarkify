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
  payments: 'payments_updated',
  notifications: 'notifications_updated',
} as const;

// Lightweight in-memory cache so hot paths (payments, notifications) don't hit
// the database on every request. Writes invalidate the affected group.
const CACHE_TTL_MS = 30_000;
const cache = new Map<SettingsGroup, { value: unknown; expires: number }>();

function cacheGet(group: SettingsGroup): unknown | undefined {
  const hit = cache.get(group);
  if (hit && hit.expires > Date.now()) return hit.value;
  cache.delete(group);
  return undefined;
}

function cacheSet(group: SettingsGroup, value: unknown): void {
  cache.set(group, { value, expires: Date.now() + CACHE_TTL_MS });
}

/** Clear the in-memory settings cache (used by tests and on demand). */
export function resetSettingsCache(): void {
  cache.clear();
}

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
    const merged = mergeDefaults(group, byKey.get(group) ?? null);
    cacheSet(group, merged);
    result[group] = merged;
  }
  return result as unknown as AllSettings;
}

export async function getSettings<K extends SettingsGroup>(group: K): Promise<SettingsValueMap[K]> {
  const cached = cacheGet(group);
  if (cached !== undefined) return cached as SettingsValueMap[K];
  const stored = await repo.getValue(group);
  const merged = mergeDefaults(group, stored);
  cacheSet(group, merged);
  return merged;
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
  cache.delete(group);
  await recordEvent(
    adminUserId,
    SETTINGS_AUDIT_EVENTS[group],
    { group },
    ipAddress,
    userAgent,
  );
  return parsed;
}


