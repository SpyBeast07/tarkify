import { adminFetch, AdminApiError } from './client';

export type EmailStatus = 'sent' | 'failed' | 'logged' | 'skipped' | 'queued' | 'retrying';

export interface EmailLogRecord {
	id: string;
	recipient: string;
	template: string;
	provider: string;
	provider_id: string | null;
	status: EmailStatus;
	error: string | null;
	sent_at: string;
	metadata: Record<string, unknown>;
}

export interface EmailListResponse {
	emails: EmailLogRecord[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export interface EmailListParams {
	search?: string;
	status?: EmailStatus;
	template?: string;
	provider?: string;
	dateFrom?: string;
	dateTo?: string;
	sort?: 'newest' | 'oldest';
	page?: number;
	perPage?: number;
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

export interface EmailTimelineEvent {
	event: string;
	description: string;
	timestamp: string | null;
}

export interface EmailDetail extends EmailLogRecord {
	fromEmail: string;
	replyToEmail: string;
	retryCount: number;
	htmlPreview: string | null;
	textPreview: string | null;
	timeline: EmailTimelineEvent[];
}

export async function listEmails(params: EmailListParams = {}): Promise<EmailListResponse> {
	const sp = new URLSearchParams();
	if (params.search) sp.set('search', params.search);
	if (params.status) sp.set('status', params.status);
	if (params.template) sp.set('template', params.template);
	if (params.provider) sp.set('provider', params.provider);
	if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
	if (params.dateTo) sp.set('dateTo', params.dateTo);
	if (params.sort) sp.set('sort', params.sort);
	if (params.page) sp.set('page', String(params.page));
	if (params.perPage) sp.set('perPage', String(params.perPage));
	return adminFetch<EmailListResponse>(`/email?${sp}`);
}

export async function getEmail(id: string): Promise<EmailDetail> {
	return adminFetch<EmailDetail>(`/email/${id}`);
}

export async function getStats(): Promise<EmailStats> {
	return adminFetch<EmailStats>('/email/stats');
}

export async function getTemplates(): Promise<TemplateInfo[]> {
	return adminFetch<TemplateInfo[]>('/email/templates');
}

export async function getProviderStatus(): Promise<ProviderStatus> {
	return adminFetch<ProviderStatus>('/email/provider');
}

export async function getHistory(limit = 50): Promise<EmailLogRecord[]> {
	return adminFetch<EmailLogRecord[]>(`/email/history?limit=${limit}`);
}

export async function sendTestEmail(recipient: string): Promise<{ success: boolean; id: string; status: string }> {
	return adminFetch(`/email/test`, {
		method: 'POST',
		body: JSON.stringify({ recipient })
	});
}

export async function resendEmail(id: string): Promise<{ success: boolean; id: string; status: string }> {
	return adminFetch(`/email/${id}/resend`, { method: 'POST' });
}
