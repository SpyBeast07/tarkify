import { adminFetch, AdminApiError } from './client';
import type {
  SystemOverview,
  ApplicationHealth,
  DatabaseHealth,
  StorageHealth,
  EmailHealth,
  PaymentsHealth,
  OAuthHealth,
  ApiHealth,
  DiskHealth,
  MemoryHealth,
  EnvironmentHealth,
  VersionHealth,
} from '$lib/admin/types/system';

export async function getSystemOverview(): Promise<SystemOverview> {
  return adminFetch<SystemOverview>('/system');
}
export async function getApplication(): Promise<ApplicationHealth> {
  return adminFetch<ApplicationHealth>('/system/application');
}
export async function getDatabase(): Promise<DatabaseHealth> {
  return adminFetch<DatabaseHealth>('/system/database');
}
export async function getStorage(): Promise<StorageHealth> {
  return adminFetch<StorageHealth>('/system/storage');
}
export async function getEmail(): Promise<EmailHealth> {
  return adminFetch<EmailHealth>('/system/email');
}
export async function getPayments(): Promise<PaymentsHealth> {
  return adminFetch<PaymentsHealth>('/system/payments');
}
export async function getOAuth(): Promise<OAuthHealth> {
  return adminFetch<OAuthHealth>('/system/oauth');
}
export async function getApi(): Promise<ApiHealth> {
  return adminFetch<ApiHealth>('/system/api');
}
export async function getDisk(): Promise<DiskHealth> {
  return adminFetch<DiskHealth>('/system/disk');
}
export async function getMemory(): Promise<MemoryHealth> {
  return adminFetch<MemoryHealth>('/system/memory');
}
export async function getEnvironment(): Promise<EnvironmentHealth> {
  return adminFetch<EnvironmentHealth>('/system/environment');
}
export async function getVersion(): Promise<VersionHealth> {
  return adminFetch<VersionHealth>('/system/version');
}

export { AdminApiError };
