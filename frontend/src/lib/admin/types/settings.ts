export type SettingsGroup =
	| 'payments'
	| 'notifications';

export interface PaymentsSettings {
	enablePayments: boolean;
	maintenanceMode: boolean;
	acceptedCurrency: string;
	taxEnabled: boolean;
	receiptPrefix: string;
}

export interface NotificationsSettings {
	adminEmailAlerts: boolean;
	paymentAlerts: boolean;
	downloadAlerts: boolean;
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
			{ key: 'enablePayments', label: 'Enable Payments', type: 'toggle' },
			{ key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle' },
			{
				key: 'acceptedCurrency',
				label: 'Accepted Currency',
				type: 'text',
				required: true,
				placeholder: 'e.g. INR'
			},
			{ key: 'taxEnabled', label: 'Tax Enabled', type: 'toggle' },
			{ key: 'receiptPrefix', label: 'Receipt Prefix', type: 'text', required: true }
		]
	},
	{
		id: 'notifications',
		label: 'Notifications',
		description: 'Choose which events trigger admin alerts.',
		fields: [
			{ key: 'adminEmailAlerts', label: 'Admin Email Alerts', type: 'toggle' },
			{ key: 'paymentAlerts', label: 'Payment Alerts', type: 'toggle' },
			{ key: 'downloadAlerts', label: 'Download Alerts', type: 'toggle' },
			{ key: 'contactAlerts', label: 'Contact Alerts', type: 'toggle' },
			{ key: 'careerAlerts', label: 'Career Alerts', type: 'toggle' },
			{ key: 'newsletterAlerts', label: 'Newsletter Alerts', type: 'toggle' },
			{ key: 'systemAlerts', label: 'System Alerts', type: 'toggle' }
		]
	}
];
