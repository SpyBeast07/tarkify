export type AuditModule =
	| 'Authentication'
	| 'Products'
	| 'Orders'
	| 'Payments'
	| 'Downloads'
	| 'Customers'
	| 'Communication'
	| 'Emails'
	| 'Settings'
	| 'System'
	| 'Analytics'
	| 'Admin';

export type AuditStatus = 'success' | 'failed';

export const AUDIT_MODULES: AuditModule[] = [
	'Authentication',
	'Products',
	'Orders',
	'Payments',
	'Downloads',
	'Customers',
	'Communication',
	'Emails',
	'Settings',
	'System',
	'Analytics',
	'Admin'
];

export interface AuditActor {
	id: string;
	email: string;
	name: string | null;
}

export interface AuditEventRow {
	id: string;
	event: string;
	module: AuditModule;
	status: AuditStatus;
	actor: AuditActor | null;
	target: string | null;
	ipAddress: string | null;
	userAgent: string | null;
	device: string | null;
	requestId: string | null;
	metadata: Record<string, unknown>;
	summary: string;
	createdAt: string;
}

export interface AuditListParams {
	search?: string;
	event?: string;
	module?: AuditModule;
	status?: AuditStatus;
	actor?: string;
	target?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	perPage?: number;
	sort?: 'newest' | 'oldest' | 'event' | 'module' | 'actor';
}

export interface AuditListResponse {
	events: AuditEventRow[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export interface AuditStats {
	total: number;
	today: number;
	failed: number;
	successful: number;
	uniqueAdmins: number;
}

export interface AuditOptions {
	events: string[];
	modules: AuditModule[];
	actors: AuditActor[];
	statuses: AuditStatus[];
}

export interface AuditDetail extends AuditEventRow {
	relatedEntity: { key: string; value: string }[];
}
