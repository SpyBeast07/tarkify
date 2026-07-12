export type SettingsGroup =
	| 'payments'
	| 'notifications';

export interface PaymentsSettings {
	maintenanceMode: boolean;
	taxEnabled: boolean;
}

export interface NotificationsSettings {
	adminEmailAlerts: boolean;
	paymentAlerts: boolean;
	feedbackAlerts: boolean;
	contactAlerts: boolean;
	careerAlerts: boolean;
	newsletterAlerts: boolean;
	systemAlerts: boolean;
}

export interface AllSettings {
	payments: PaymentsSettings;
	notifications: NotificationsSettings;
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
	'payments',
	'notifications'
];

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
	payments: 'Payments',
	notifications: 'Notifications'
};

export type FieldType =
	| 'text'
	| 'toggle';

export interface FieldOption {
	value: string;
	label: string;
}

export interface FieldConfig {
	key: string;
	label: string;
	type: FieldType;
	required?: boolean;
	placeholder?: string;
	help?: string;
	options?: FieldOption[];
	min?: number;
	max?: number;
	readOnly?: boolean;
}

export interface SectionConfig {
	id: SettingsGroup;
	label: string;
	description: string;
	fields: FieldConfig[];
}

// ─── Section field configuration (single source of truth for the UI) ─────────

export const SETTINGS_SECTIONS: SectionConfig[] = [
	{
		id: 'payments',
		label: 'Payments',
		description: 'Payment and receipt behavior. Gateway secrets are managed outside the app.',
		fields: [
			{ key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle' },
			{ key: 'taxEnabled', label: 'Tax Enabled', type: 'toggle' }
		]
	},
	{
		id: 'notifications',
		label: 'Notifications',
		description: 'Choose which events send admin notifications. Customer transactional emails (receipts, download links, acknowledgements, confirmations) are always sent.',
		fields: [
			{ key: 'adminEmailAlerts', label: 'New Order Notifications', type: 'toggle', help: 'Notify admins when a new order is completed.' },
			{ key: 'paymentAlerts', label: 'Payment Issue Notifications', type: 'toggle', help: 'Notify admins about payment failures, refunds, and webhook errors.' },
			{ key: 'feedbackAlerts', label: 'Feedback Notifications', type: 'toggle', help: 'Notify admins when new feedback is submitted.' },
			{ key: 'contactAlerts', label: 'Contact Form Notifications', type: 'toggle', help: 'Notify admins when a contact form is submitted.' },
			{ key: 'careerAlerts', label: 'Career Application Notifications', type: 'toggle', help: 'Notify admins when a career application is received.' },
			{ key: 'newsletterAlerts', label: 'Newsletter Notifications', type: 'toggle', help: 'Notify admins when someone subscribes to the newsletter.' },
			{ key: 'systemAlerts', label: 'System Notifications', type: 'toggle', help: 'Notify admins about email delivery failures.' }
		]
	}
];
