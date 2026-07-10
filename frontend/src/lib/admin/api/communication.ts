import { adminFetch, AdminApiError } from './client';

export type RecordType = 'contact' | 'feedback' | 'newsletter' | 'careers';
export type CommStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

export interface CommNote {
	id: string;
	record_type: RecordType;
	record_id: string;
	author_id: string;
	author_name: string | null;
	content: string;
	created_at: string;
}

export interface CommTag {
	id: string;
	name: string;
	color: string;
	created_at: string;
}

export interface CommRecordTag {
	record_type: RecordType;
	record_id: string;
	tag_id: string;
	tag_name: string;
	tag_color: string;
	created_at: string;
}

export interface CommAuditEntry {
	id: string;
	event: string;
	user_id: string | null;
	user_name: string | null;
	metadata: Record<string, unknown>;
	created_at: string;
}

export interface ListParams {
	search?: string;
	status?: CommStatus;
	archived?: 'true' | 'false';
	dateFrom?: string;
	dateTo?: string;
	sort?: 'newest' | 'oldest' | 'status' | 'updated';
	page?: number;
	perPage?: number;
}

export interface ListResponse<T> {
	items: T[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export interface DetailResponse<T> {
	record: T;
	notes: CommNote[];
	tags: CommRecordTag[];
	audit: CommAuditEntry[];
}

// ─── List helpers ───────────────────────────────────────────────────────────

function buildParams(params: ListParams): URLSearchParams {
	const sp = new URLSearchParams();
	if (params.search) sp.set('search', params.search);
	if (params.status) sp.set('status', params.status);
	if (params.archived) sp.set('archived', params.archived);
	if (params.dateFrom) sp.set('dateFrom', params.dateFrom);
	if (params.dateTo) sp.set('dateTo', params.dateTo);
	if (params.sort) sp.set('sort', params.sort);
	if (params.page) sp.set('page', String(params.page));
	if (params.perPage) sp.set('perPage', String(params.perPage));
	return sp;
}

export async function listRecords<T>(recordType: RecordType, params: ListParams = {}): Promise<ListResponse<T>> {
	const sp = buildParams(params);
	return adminFetch<ListResponse<T>>(`/communication/${recordType}?${sp}`);
}

export async function getRecord<T>(recordType: RecordType, id: string): Promise<DetailResponse<T>> {
	return adminFetch<DetailResponse<T>>(`/communication/${recordType}/${id}`);
}

export async function setStatus(recordType: RecordType, id: string, status: CommStatus): Promise<void> {
	await adminFetch(`/communication/${recordType}/${id}/status`, {
		method: 'PUT',
		body: JSON.stringify({ status })
	});
}

export async function archiveRecord(recordType: RecordType, id: string): Promise<void> {
	await adminFetch(`/communication/${recordType}/${id}/archive`, { method: 'PUT' });
}

export async function restoreRecord(recordType: RecordType, id: string): Promise<void> {
	await adminFetch(`/communication/${recordType}/${id}/restore`, { method: 'PUT' });
}

export async function deleteRecord(recordType: RecordType, id: string): Promise<void> {
	await adminFetch(`/communication/${recordType}/${id}`, { method: 'DELETE' });
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function listTags(): Promise<CommTag[]> {
	return adminFetch<CommTag[]>('/communication/tags');
}

export async function createTag(name: string, color = '#6366f1'): Promise<CommTag> {
	return adminFetch<CommTag>('/communication/tags', {
		method: 'POST',
		body: JSON.stringify({ name, color })
	});
}

export async function updateTag(id: string, name: string, color: string): Promise<CommTag> {
	return adminFetch<CommTag>(`/communication/tags/${id}`, {
		method: 'PUT',
		body: JSON.stringify({ name, color })
	});
}

export async function deleteTag(id: string): Promise<void> {
	await adminFetch(`/communication/tags/${id}`, { method: 'DELETE' });
}

export async function getRecordTags(recordType: RecordType, recordId: string): Promise<CommTag[]> {
	return adminFetch<CommTag[]>(`/communication/${recordType}/${recordId}/tags`);
}

export async function addTagToRecord(recordType: RecordType, recordId: string, tagId: string): Promise<void> {
	await adminFetch(`/communication/${recordType}/${recordId}/tags`, {
		method: 'POST',
		body: JSON.stringify({ tag_id: tagId })
	});
}

export async function removeTagFromRecord(recordType: RecordType, recordId: string, tagId: string): Promise<void> {
	await adminFetch(`/communication/${recordType}/${recordId}/tags/${tagId}`, { method: 'DELETE' });
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function getNotes(recordType: RecordType, recordId: string): Promise<CommNote[]> {
	return adminFetch<CommNote[]>(`/communication/${recordType}/${recordId}/notes`);
}

export async function addNote(recordType: RecordType, recordId: string, content: string): Promise<CommNote> {
	return adminFetch<CommNote>(`/communication/${recordType}/${recordId}/notes`, {
		method: 'POST',
		body: JSON.stringify({ content })
	});
}

// ─── Reply ───────────────────────────────────────────────────────────────────

export async function replyToRecord(recordType: RecordType, recordId: string, subject: string, message: string): Promise<void> {
	await adminFetch(`/communication/${recordType}/${recordId}/reply`, {
		method: 'POST',
		body: JSON.stringify({ subject, message })
	});
}
