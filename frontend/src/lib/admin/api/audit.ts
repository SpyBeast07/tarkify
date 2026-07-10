import { adminFetch, AdminApiError } from './client';
import { API_BASE } from '$lib/api/config';
import type {
	AuditDetail,
	AuditListParams,
	AuditListResponse,
	AuditOptions,
	AuditStats
} from '$lib/admin/types/audit';

export async function getAuditLogs(params: AuditListParams): Promise<AuditListResponse> {
	const qs = new URLSearchParams();
	if (params.search) qs.set('search', params.search);
	if (params.event) qs.set('event', params.event);
	if (params.module) qs.set('module', params.module);
	if (params.actor) qs.set('actor', params.actor);
	if (params.target) qs.set('target', params.target);
	if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
	if (params.dateTo) qs.set('dateTo', params.dateTo);
	if (params.sort) qs.set('sort', params.sort);
	if (params.page) qs.set('page', String(params.page));
	if (params.perPage) qs.set('perPage', String(params.perPage));
	return adminFetch<AuditListResponse>(`/audit?${qs.toString()}`);
}

export async function getAuditDetail(id: string): Promise<AuditDetail> {
	return adminFetch<AuditDetail>(`/audit/${id}`);
}

export async function getAuditOptions(): Promise<AuditOptions> {
	return adminFetch<AuditOptions>('/audit/options');
}

export async function getAuditStats(): Promise<AuditStats> {
	return adminFetch<AuditStats>('/audit/stats');
}

export function buildAuditExportUrl(params: AuditListParams, format: 'csv' | 'json'): string {
	const qs = new URLSearchParams();
	if (params.search) qs.set('search', params.search);
	if (params.event) qs.set('event', params.event);
	if (params.module) qs.set('module', params.module);
	if (params.actor) qs.set('actor', params.actor);
	if (params.target) qs.set('target', params.target);
	if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
	if (params.dateTo) qs.set('dateTo', params.dateTo);
	qs.set('format', format);
	return `${API_BASE}/api/admin/audit/export?${qs.toString()}`;
}

export { AdminApiError };
