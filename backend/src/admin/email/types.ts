import type { EmailLogRecord } from '../../email/log-repository.js';

export type EmailStatus = 'sent' | 'failed' | 'logged' | 'skipped' | 'queued' | 'retrying';

export interface EmailListItem extends EmailLogRecord {}

export interface EmailListParams {
  search?: string;
  status?: string;
  template?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  perPage?: number;
}

export interface EmailListResponse {
  emails: EmailListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  logged: number;
  skipped: number;
  queued: number;
  retrying: number;
  successRate: number;
  last24h: number;
}

export type ProviderCurrentStatus = 'operational' | 'degraded' | 'down' | 'unconfigured';

export interface ProviderStatus {
  name: string;
  currentStatus: ProviderCurrentStatus;
  configured: boolean;
  apiKeyPresent: boolean;
  fromEmail: string;
  replyToEmail: string;
  adminEmail: string;
  environment: string;
  lastSuccessfulAt: string | null;
  lastFailedAt: string | null;
}

export interface TemplateInfo {
  key: string;
  name: string;
  purpose: string;
  variables: string[];
  previewAvailable: boolean;
}

export interface EmailDetail extends EmailLogRecord {
  fromEmail: string;
  replyToEmail: string;
  retryCount: number;
  htmlPreview: string | null;
  textPreview: string | null;
  timeline: EmailTimelineEvent[];
}

export interface EmailTimelineEvent {
  event: string;
  description: string;
  timestamp: string | null;
}
