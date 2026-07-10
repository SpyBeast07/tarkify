import * as repo from './repository.js';
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
  HealthStatus,
} from './types.js';

const CACHE_TTL_MS = 8000;
const cache = new Map<string, { ts: number; value: unknown }>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return hit.value as T;
  }
  const value = await fn();
  cache.set(key, { ts: Date.now(), value });
  return value;
}

export function getApplication(): Promise<ApplicationHealth> {
  return cached('application', repo.getApplicationHealth);
}
export function getDatabase(): Promise<DatabaseHealth> {
  return cached('database', repo.getDatabaseHealth);
}
export function getStorage(): Promise<StorageHealth> {
  return cached('storage', repo.getStorageHealth);
}
export function getEmail(): Promise<EmailHealth> {
  return cached('email', repo.getEmailHealth);
}
export function getPayments(): Promise<PaymentsHealth> {
  return cached('payments', repo.getPaymentsHealth);
}
export function getOAuth(): Promise<OAuthHealth> {
  return cached('oauth', repo.getOAuthHealth);
}
export function getApi(): Promise<ApiHealth> {
  return cached('api', repo.getApiHealth);
}
export function getDisk(): Promise<DiskHealth> {
  return cached('disk', repo.getDiskHealth);
}
export function getMemory(): Promise<MemoryHealth> {
  return cached('memory', repo.getMemoryHealth);
}
export function getEnvironment(): Promise<EnvironmentHealth> {
  return cached('environment', repo.getEnvironmentHealth);
}
export function getVersion(): Promise<VersionHealth> {
  return cached('version', repo.getVersionHealth);
}

function worst(statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>(
    (acc, s) => (repo.RANK[s] > repo.RANK[acc] ? s : acc),
    'healthy',
  );
}

export async function getOverview(): Promise<SystemOverview> {
  const [
    application,
    database,
    storage,
    email,
    payments,
    oauth,
    api,
    disk,
    memory,
    environment,
    version,
  ] = await Promise.all([
    getApplication(),
    getDatabase(),
    getStorage(),
    getEmail(),
    getPayments(),
    getOAuth(),
    getApi(),
    getDisk(),
    getMemory(),
    getEnvironment(),
    getVersion(),
  ]);

  const overall = worst([
    application.status,
    database.status,
    storage.status,
    email.status,
    payments.status,
    oauth.status,
    api.status,
    disk.status,
    memory.status,
    environment.status,
    version.status,
  ]);

  return {
    application,
    database,
    storage,
    email,
    payments,
    oauth,
    api,
    disk,
    memory,
    environment,
    version,
    overall,
    generatedAt: new Date().toISOString(),
  };
}
