export type HealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface BaseHealth {
  status: HealthStatus;
  message?: string;
}

export interface ApplicationHealth extends BaseHealth {
  uptimeSeconds: number;
  startedAt: string;
  runtime: string;
  nodeVersion: string;
  bunVersion: string | null;
  processId: number;
  environment: string;
  buildVersion: string;
  currentTime: string;
  timezone: string;
}

export interface DatabaseHealth extends BaseHealth {
  connected: boolean;
  pool: { total: number; idle: number; waiting: number };
  version: string | null;
  migrationCount: number | null;
  latestMigration: string | null;
  totalTables: number | null;
  responseTimeMs: number | null;
}

export interface StorageHealth extends BaseHealth {
  configuredPath: string;
  readable: boolean;
  writable: boolean;
  totalBytes: number | null;
  usedBytes: number | null;
  freeBytes: number | null;
}

export interface EmailHealth extends BaseHealth {
  provider: string;
  configured: boolean;
  defaultFrom: string;
  replyTo: string;
  lastSuccessfulAt: string | null;
  lastFailedAt: string | null;
  totalSent: number;
  totalFailed: number;
}

export interface PaymentsHealth extends BaseHealth {
  provider: string;
  configured: boolean;
  webhookConfigured: boolean;
  environment: 'live' | 'test' | 'unknown';
  lastPaymentAt: string | null;
  lastWebhookAt: string | null;
}

export interface OAuthHealth extends BaseHealth {
  googleEnabled: boolean;
  googleConfigured: boolean;
  callbackUrl: string | null;
}

export interface ApiHealth extends BaseHealth {
  healthEndpoint: string;
  readyEndpoint: string;
  healthReachable: boolean;
  readyReachable: boolean;
  averageResponseTimeMs: number | null;
  requestCount: number | null;
  errorCount: number | null;
}

export interface DiskHealth extends BaseHealth {
  path: string;
  totalBytes: number | null;
  usedBytes: number | null;
  freeBytes: number | null;
  usedPercentage: number | null;
}

export interface MemoryHealth extends BaseHealth {
  heapUsedBytes: number;
  heapTotalBytes: number;
  rssBytes: number;
  externalBytes: number;
  usagePercentage: number | null;
}

export interface EnvironmentHealth extends BaseHealth {
  nodeEnvironment: string;
  frontendUrl: string;
  backendUrl: string;
  storagePath: string;
  emailProvider: string;
  paymentProvider: string;
  oauthEnabled: boolean;
  applicationVersion: string;
}

export interface VersionHealth extends BaseHealth {
  applicationVersion: string;
  gitCommit: string | null;
  buildTime: string | null;
  schemaVersion: string | null;
  latestMigration: string | null;
  dockerImage: string | null;
}

export interface SystemOverview {
  application: ApplicationHealth;
  database: DatabaseHealth;
  storage: StorageHealth;
  email: EmailHealth;
  payments: PaymentsHealth;
  oauth: OAuthHealth;
  api: ApiHealth;
  disk: DiskHealth;
  memory: MemoryHealth;
  environment: EnvironmentHealth;
  version: VersionHealth;
  overall: HealthStatus;
  generatedAt: string;
}
