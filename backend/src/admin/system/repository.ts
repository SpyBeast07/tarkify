import { existsSync, accessSync, constants, writeFileSync, unlinkSync, statfsSync } from 'fs';
import { join } from 'path';
import { pool, query } from '../../db.js';
import { config } from '../../config.js';
import type {
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

function statfsSafe(path: string): { total: number; free: number } | null {
  try {
    const fn = (statfsSync as unknown) as ((p: string) => { bavail: number; blocks: number; bsize: number; bfree: number }) | undefined;
    if (typeof fn !== 'function') return null;
    const stats = fn(path);
    if (!stats || !stats.bsize) return null;
    return {
      total: stats.blocks * stats.bsize,
      free: stats.bavail * stats.bsize,
    };
  } catch {
    return null;
  }
}

// ─── Application ───────────────────────────────────────────────────────────

export async function getApplicationHealth(): Promise<ApplicationHealth> {
  const uptimeSeconds = Math.floor(process.uptime());
  const bunVersion = (process.versions as Record<string, string>).bun ?? null;
  return {
    status: 'healthy',
    uptimeSeconds,
    startedAt: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
    runtime: bunVersion ? 'Bun' : 'Node.js',
    nodeVersion: process.version,
    bunVersion,
    processId: process.pid,
    environment: config.nodeEnv,
    buildVersion: process.env.APP_VERSION || 'unknown',
    currentTime: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };
}

// ─── Database ──────────────────────────────────────────────────────────────

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const base: DatabaseHealth = {
    status: 'error',
    connected: false,
    pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
    version: null,
    migrationCount: null,
    latestMigration: null,
    totalTables: null,
    responseTimeMs: null,
  };

  try {
    const start = performance.now();
    await query('SELECT 1');
    const responseTimeMs = Math.round((performance.now() - start) * 100) / 100;
    base.connected = true;
    base.responseTimeMs = responseTimeMs;
    base.status = responseTimeMs > 500 ? 'warning' : 'healthy';

    const [versionRes, migRes, tablesRes] = await Promise.all([
      query<{ version: string }>('SELECT version()'),
      query<{ count: number; latest: string | null }>(
        `SELECT COUNT(*)::int AS count, MAX(name) AS latest FROM _migrations`,
      ).catch(() => ({ rows: [{ count: 0, latest: null }] })),
      query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'`,
      ).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    base.version = versionRes.rows[0]?.version ?? null;
    base.migrationCount = Number(migRes.rows[0]?.count ?? 0);
    base.latestMigration = migRes.rows[0]?.latest ?? null;
    base.totalTables = Number(tablesRes.rows[0]?.count ?? 0);
  } catch (err) {
    return { ...base, message: err instanceof Error ? err.message : 'Database unreachable' };
  }

  return base;
}

// ─── Storage ───────────────────────────────────────────────────────────────

export async function getStorageHealth(): Promise<StorageHealth> {
  const path = config.storagePath;
  const base: StorageHealth = {
    status: 'unknown',
    configuredPath: path,
    readable: false,
    writable: false,
    totalBytes: null,
    usedBytes: null,
    freeBytes: null,
  };

  try {
    if (!existsSync(path)) {
      return { ...base, status: 'error', message: 'Storage directory does not exist' };
    }
    accessSync(path, constants.R_OK);
    base.readable = true;

    const probe = join(path, `.health-write-probe-${process.pid}`);
    writeFileSync(probe, 'ok');
    unlinkSync(probe);
    base.writable = true;

    const fsStats = statfsSafe(path);
    if (fsStats) {
      base.totalBytes = fsStats.total;
      base.freeBytes = fsStats.free;
      base.usedBytes = fsStats.total - fsStats.free;
    }

    base.status = base.readable && base.writable ? 'healthy' : 'error';
  } catch (err) {
    return { ...base, status: 'error', message: err instanceof Error ? err.message : 'Storage check failed' };
  }

  return base;
}

// ─── Email ─────────────────────────────────────────────────────────────────

export async function getEmailHealth(): Promise<EmailHealth> {
  const configured = Boolean(config.email.resendApiKey);
  const base: EmailHealth = {
    status: configured ? 'healthy' : 'error',
    provider: config.email.provider,
    configured,
    defaultFrom: config.email.fromEmail,
    replyTo: config.email.replyToEmail,
    lastSuccessfulAt: null,
    lastFailedAt: null,
    totalSent: 0,
    totalFailed: 0,
  };

  try {
    const [sent, failed] = await Promise.all([
      query<{ count: number; last_at: Date | null }>(
        `SELECT COUNT(*)::int AS count, MAX(sent_at) AS last_at FROM email_logs WHERE status IN ('sent', 'logged')`,
      ),
      query<{ count: number; last_at: Date | null }>(
        `SELECT COUNT(*)::int AS count, MAX(sent_at) AS last_at FROM email_logs WHERE status = 'failed'`,
      ),
    ]);
    base.totalSent = Number(sent.rows[0]?.count ?? 0);
    base.lastSuccessfulAt = sent.rows[0]?.last_at ? new Date(sent.rows[0].last_at).toISOString() : null;
    base.totalFailed = Number(failed.rows[0]?.count ?? 0);
    base.lastFailedAt = failed.rows[0]?.last_at ? new Date(failed.rows[0].last_at).toISOString() : null;
  } catch (err) {
    return { ...base, message: err instanceof Error ? err.message : 'Email stats unavailable' };
  }

  return base;
}

// ─── Payments ──────────────────────────────────────────────────────────────

export async function getPaymentsHealth(): Promise<PaymentsHealth> {
  const configured = Boolean(config.razorpay.keyId);
  const webhookConfigured = Boolean(config.razorpay.webhookSecret);
  const environment: PaymentsHealth['environment'] = config.razorpay.keyId.startsWith('rzp_live_')
    ? 'live'
    : config.razorpay.keyId.startsWith('rzp_test_')
      ? 'test'
      : 'unknown';

  const base: PaymentsHealth = {
    status: configured ? 'healthy' : 'error',
    provider: 'razorpay',
    configured,
    webhookConfigured,
    environment,
    lastPaymentAt: null,
    lastWebhookAt: null,
  };

  try {
    const res = await query<{ last_at: Date | null }>(
      `SELECT MAX(created_at) AS last_at FROM purchases WHERE status = 'paid'`,
    );
    base.lastPaymentAt = res.rows[0]?.last_at ? new Date(res.rows[0].last_at).toISOString() : null;
  } catch (err) {
    return { ...base, message: err instanceof Error ? err.message : 'Payment stats unavailable' };
  }

  return base;
}

// ─── OAuth ─────────────────────────────────────────────────────────────────

export async function getOAuthHealth(): Promise<OAuthHealth> {
  const googleConfigured = Boolean(config.auth.googleClientId && config.auth.googleClientSecret);
  return {
    status: config.googleOAuthEnabled ? 'healthy' : 'unknown',
    googleEnabled: config.googleOAuthEnabled,
    googleConfigured,
    callbackUrl: googleConfigured ? `${config.auth.url}/api/auth/callback/google` : null,
  };
}

// ─── API (reuses /api/health and /api/ready) ───────────────────────────────

export async function getApiHealth(): Promise<ApiHealth> {
  const baseUrl = `http://127.0.0.1:${config.port}`;
  const healthEndpoint = '/api/health';
  const readyEndpoint = '/api/ready';

  const probe = async (path: string): Promise<{ ok: boolean; ms: number }> => {
    const start = performance.now();
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(baseUrl + path, { signal: ctrl.signal });
      clearTimeout(t);
      return { ok: res.ok, ms: Math.round((performance.now() - start) * 100) / 100 };
    } catch {
      return { ok: false, ms: Math.round((performance.now() - start) * 100) / 100 };
    }
  };

  const [health, ready] = await Promise.all([probe(healthEndpoint), probe(readyEndpoint)]);
  const times = [health.ms, ready.ms].filter((n) => n >= 0);
  const avg = times.length ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 100) / 100 : null;

  const healthy = health.ok && ready.ok;
  return {
    status: healthy ? 'healthy' : 'error',
    healthEndpoint,
    readyEndpoint,
    healthReachable: health.ok,
    readyReachable: ready.ok,
    averageResponseTimeMs: avg,
    requestCount: null,
    errorCount: null,
    message: healthy ? undefined : 'One or more internal health endpoints unreachable',
  };
}

// ─── Disk ──────────────────────────────────────────────────────────────────

export async function getDiskHealth(): Promise<DiskHealth> {
  const path = config.storagePath;
  const fsStats = statfsSafe(path);
  if (!fsStats) {
    return {
      status: 'unknown',
      path,
      totalBytes: null,
      usedBytes: null,
      freeBytes: null,
      usedPercentage: null,
      message: 'Disk statistics unavailable on this platform',
    };
  }
  const used = fsStats.total - fsStats.free;
  const usedPercentage = Math.round((used / fsStats.total) * 1000) / 10;
  const status: HealthStatus = usedPercentage >= 95 ? 'error' : usedPercentage >= 90 ? 'warning' : 'healthy';
  return {
    status,
    path,
    totalBytes: fsStats.total,
    usedBytes: used,
    freeBytes: fsStats.free,
    usedPercentage,
  };
}

// ─── Memory ────────────────────────────────────────────────────────────────

export async function getMemoryHealth(): Promise<MemoryHealth> {
  const mem = process.memoryUsage();
  const usagePercentage = Math.round((mem.heapUsed / mem.heapTotal) * 1000) / 10;
  const status: HealthStatus = usagePercentage >= 90 ? 'error' : usagePercentage >= 80 ? 'warning' : 'healthy';
  return {
    status,
    heapUsedBytes: mem.heapUsed,
    heapTotalBytes: mem.heapTotal,
    rssBytes: mem.rss,
    externalBytes: mem.external,
    usagePercentage,
  };
}

// ─── Environment (safe values only) ───────────────────────────────────────

export async function getEnvironmentHealth(): Promise<EnvironmentHealth> {
  return {
    status: 'healthy',
    nodeEnvironment: config.nodeEnv,
    frontendUrl: config.frontendUrl,
    backendUrl: config.auth.url,
    storagePath: config.storagePath,
    emailProvider: config.email.provider,
    paymentProvider: 'razorpay',
    oauthEnabled: config.googleOAuthEnabled,
    applicationVersion: process.env.APP_VERSION || 'unknown',
  };
}

// ─── Version ───────────────────────────────────────────────────────────────

export async function getVersionHealth(): Promise<VersionHealth> {
  let schemaVersion: string | null = null;
  let latestMigration: string | null = null;
  try {
    const res = await query<{ count: number; latest: string | null }>(
      `SELECT COUNT(*)::int AS count, MAX(name) AS latest FROM _migrations`,
    );
    schemaVersion = String(res.rows[0]?.count ?? 0);
    latestMigration = res.rows[0]?.latest ?? null;
  } catch {
    /* migrations table may not be queryable */
  }

  return {
    status: 'healthy',
    applicationVersion: process.env.APP_VERSION || 'unknown',
    gitCommit: process.env.GIT_COMMIT || null,
    buildTime: process.env.BUILD_TIME || null,
    schemaVersion,
    latestMigration,
    dockerImage: process.env.DOCKER_IMAGE || null,
  };
}

export const RANK: Record<HealthStatus, number> = { healthy: 0, unknown: 1, warning: 2, error: 3 };
