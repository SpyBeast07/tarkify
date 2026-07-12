export type SettingsGroup = 'payments' | 'notifications';

export interface PaymentsSettings {
	maintenanceMode: boolean;
	taxEnabled: boolean;
	taxRate: number;
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

export const SETTINGS_GROUPS: SettingsGroup[] = ['payments', 'notifications'];

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
	payments: 'Payments',
	notifications: 'Admin Notification Preferences'
};

export type FieldType = 'text' | 'number' | 'toggle';

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
	step?: number;
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
			{ key: 'taxEnabled', label: 'Tax Enabled', type: 'toggle' },
			{ key: 'taxRate', label: 'Tax Rate (%)', type: 'number', min: 0, max: 100, step: 0.01, help: 'Tax percentage applied when Tax Enabled is on. Default: 18%.' }
		]
	},
	{
		id: 'notifications',
		label: 'Admin Notification Preferences',
		description:
			'These settings control notifications sent to administrators only. Customer transactional emails (verification, password reset, receipts, download links, acknowledgements, confirmations, replies, test emails) are always sent and cannot be disabled here.',
		fields: [
			{
				key: 'adminEmailAlerts',
				label: 'New Order Notifications',
				type: 'toggle',
				help: 'Notify admins when a new order is completed.'
			},
			{
				key: 'paymentAlerts',
				label: 'Payment Issue Notifications',
				type: 'toggle',
				help: 'Notify admins about payment failures, refunds, and webhook errors.'
			},
			{
				key: 'feedbackAlerts',
				label: 'Feedback Notifications',
				type: 'toggle',
				help: 'Notify admins when new feedback is submitted.'
			},
			{
				key: 'contactAlerts',
				label: 'Contact Form Notifications',
				type: 'toggle',
				help: 'Notify admins when a contact form is submitted.'
			},
			{
				key: 'careerAlerts',
				label: 'Career Application Notifications',
				type: 'toggle',
				help: 'Notify admins when a career application is received.'
			},
			{
				key: 'newsletterAlerts',
				label: 'Newsletter Notifications',
				type: 'toggle',
				help: 'Notify admins when someone subscribes to the newsletter.'
			},
			{
				key: 'systemAlerts',
				label: 'System Notifications',
				type: 'toggle',
				help: 'Notify admins about email delivery failures.'
			}
		]
	}
];
