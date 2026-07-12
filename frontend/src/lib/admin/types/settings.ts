export type SettingsGroup =
	| 'brand'
	| 'email'
	| 'payments'
	| 'oauth'
	| 'security'
	| 'storage'
	| 'features'
	| 'notifications'
	| 'seo'
	| 'legal';

export interface SocialLink {
	label: string;
	url: string;
}

export interface BrandSettings {
	logoUrl: string;
	faviconUrl: string;
	primaryColor: string;
	secondaryColor: string;
	companyDescription: string;
	socialLinks: SocialLink[];
}

export interface EmailSettings {
	defaultFromName: string;
	replyToName: string;
	adminNotificationEmail: string;
	emailFooter: string;
	signature: string;
	enableEmailSending: boolean;
	enableTestEmails: boolean;
}

export interface PaymentsSettings {
	enablePayments: boolean;
	maintenanceMode: boolean;
	acceptedCurrency: string;
	taxEnabled: boolean;
	receiptPrefix: string;
}

export interface OAuthSettings {
	enableGoogleLogin: boolean;
	enableAccountLinking: boolean;
	allowEmailSignup: boolean;
	requireEmailVerification: boolean;
}

export type PasswordPolicy = 'low' | 'medium' | 'high' | 'custom';
export type CleanupSchedule = 'daily' | 'weekly' | 'monthly' | 'never';
export type RobotsRule = 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow';

export interface SecuritySettings {
	passwordPolicy: PasswordPolicy;
	minimumLength: number;
	requireNumbers: boolean;
	requireSymbols: boolean;
	sessionTimeout: number;
	maximumSessions: number;
	accountLockout: boolean;
	rateLimitingEnabled: boolean;
}

export interface StorageSettings {
	storageProvider: string;
	maximumUploadSize: number;
	downloadExpiry: number;
	cleanupSchedule: CleanupSchedule;
	retentionDays: number;
}

export interface FeaturesSettings {
	customerPortal: boolean;
	adminPortal: boolean;
	downloads: boolean;
	newsletter: boolean;
	feedback: boolean;
	careers: boolean;
	analytics: boolean;
	emailCenter: boolean;
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

export interface SeoSettings {
	siteTitle: string;
	defaultDescription: string;
	keywords: string[];
	ogTitle: string;
	ogDescription: string;
	robots: RobotsRule;
	canonicalUrl: string;
}

export interface LegalSettings {
	companyName: string;
	companyAddress: string;
	gstNumber: string;
	privacyPolicyUrl: string;
	termsUrl: string;
	refundPolicyUrl: string;
	supportUrl: string;
}

export interface AllSettings {
	brand: BrandSettings;
	email: EmailSettings;
	payments: PaymentsSettings;
	oauth: OAuthSettings;
	security: SecuritySettings;
	storage: StorageSettings;
	features: FeaturesSettings;
	notifications: NotificationsSettings;
	seo: SeoSettings;
	legal: LegalSettings;
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
	'brand',
	'email',
	'payments',
	'oauth',
	'security',
	'storage',
	'features',
	'notifications',
	'seo',
	'legal'
];

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
	brand: 'Brand',
	email: 'Email',
	payments: 'Payments',
	oauth: 'OAuth',
	security: 'Security',
	storage: 'Storage',
	features: 'Features',
	notifications: 'Notifications',
	seo: 'SEO',
	legal: 'Legal'
};

export type FieldType =
	| 'text'
	| 'email'
	| 'url'
	| 'number'
	| 'textarea'
	| 'select'
	| 'toggle'
	| 'color'
	| 'tags'
	| 'social';

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

const PASSWORD_POLICY_OPTIONS: FieldOption[] = [
	{ value: 'low', label: 'Low (basic)' },
	{ value: 'medium', label: 'Medium (recommended)' },
	{ value: 'high', label: 'High (strict)' },
	{ value: 'custom', label: 'Custom' }
];

const CLEANUP_OPTIONS: FieldOption[] = [
	{ value: 'daily', label: 'Daily' },
	{ value: 'weekly', label: 'Weekly' },
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'never', label: 'Never' }
];

const ROBOTS_OPTIONS: FieldOption[] = [
	{ value: 'index,follow', label: 'Index, follow' },
	{ value: 'noindex,nofollow', label: 'No index, no follow' },
	{ value: 'index,nofollow', label: 'Index, no follow' },
	{ value: 'noindex,follow', label: 'No index, follow' }
];

export const SETTINGS_SECTIONS: SectionConfig[] = [
	{
		id: 'brand',
		label: 'Brand',
		description: 'Visual identity and social presence. Provide URLs only.',
		fields: [
			{ key: 'logoUrl', label: 'Logo URL', type: 'url', placeholder: 'https://…' },
			{ key: 'faviconUrl', label: 'Favicon URL', type: 'url', placeholder: 'https://…' },
			{ key: 'primaryColor', label: 'Primary Color', type: 'color' },
			{ key: 'secondaryColor', label: 'Secondary Color', type: 'color' },
			{ key: 'companyDescription', label: 'Company Description', type: 'textarea' },
			{ key: 'socialLinks', label: 'Social Links', type: 'social' }
		]
	},
	{
		id: 'email',
		label: 'Email',
		description: 'Runtime email behavior. Provider credentials are managed outside the app.',
		fields: [
			{ key: 'defaultFromName', label: 'Default From Name', type: 'text', required: true },
			{ key: 'replyToName', label: 'Reply-To Name', type: 'text', required: true },
			{
				key: 'adminNotificationEmail',
				label: 'Admin Notification Email',
				type: 'email',
				required: true
			},
			{ key: 'emailFooter', label: 'Email Footer', type: 'textarea' },
			{ key: 'signature', label: 'Signature', type: 'textarea' },
			{ key: 'enableEmailSending', label: 'Enable Email Sending', type: 'toggle' },
			{ key: 'enableTestEmails', label: 'Enable Test Emails', type: 'toggle' }
		]
	},
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
		id: 'oauth',
		label: 'OAuth',
		description: 'Social login and account options. Client secrets are managed outside the app.',
		fields: [
			{ key: 'enableGoogleLogin', label: 'Enable Google Login', type: 'toggle' },
			{ key: 'enableAccountLinking', label: 'Enable Account Linking', type: 'toggle' },
			{ key: 'allowEmailSignup', label: 'Allow Email Signup', type: 'toggle' },
			{ key: 'requireEmailVerification', label: 'Require Email Verification', type: 'toggle' }
		]
	},
	{
		id: 'security',
		label: 'Security',
		description: 'Password and session policies applied at runtime.',
		fields: [
			{
				key: 'passwordPolicy',
				label: 'Password Policy',
				type: 'select',
				options: PASSWORD_POLICY_OPTIONS
			},
			{ key: 'minimumLength', label: 'Minimum Length', type: 'number', min: 6, max: 128 },
			{ key: 'requireNumbers', label: 'Require Numbers', type: 'toggle' },
			{ key: 'requireSymbols', label: 'Require Symbols', type: 'toggle' },
			{
				key: 'sessionTimeout',
				label: 'Session Timeout (minutes)',
				type: 'number',
				min: 5,
				max: 1440
			},
			{ key: 'maximumSessions', label: 'Maximum Sessions', type: 'number', min: 1, max: 100 },
			{ key: 'accountLockout', label: 'Account Lockout', type: 'toggle' },
			{ key: 'rateLimitingEnabled', label: 'Rate Limiting', type: 'toggle' }
		]
	},
	{
		id: 'storage',
		label: 'Storage',
		description: 'Upload and retention limits. Storage provider is deployment-managed.',
		fields: [
			{
				key: 'storageProvider',
				label: 'Storage Provider',
				type: 'text',
				help: 'Read-only. Managed by deployment configuration.',
				required: true,
				readOnly: true
			},
			{
				key: 'maximumUploadSize',
				label: 'Maximum Upload Size (MB)',
				type: 'number',
				min: 1,
				max: 5120
			},
			{
				key: 'downloadExpiry',
				label: 'Download Expiry (seconds)',
				type: 'number',
				min: 60,
				max: 86400
			},
			{
				key: 'cleanupSchedule',
				label: 'Cleanup Schedule',
				type: 'select',
				options: CLEANUP_OPTIONS
			},
			{ key: 'retentionDays', label: 'Retention Days', type: 'number', min: 1, max: 3650 }
		]
	},
	{
		id: 'features',
		label: 'Features',
		description: 'Toggle platform modules. Future modules can be added here.',
		fields: [
			{ key: 'customerPortal', label: 'Customer Portal', type: 'toggle' },
			{ key: 'adminPortal', label: 'Admin Portal', type: 'toggle' },
			{ key: 'downloads', label: 'Downloads', type: 'toggle' },
			{ key: 'newsletter', label: 'Newsletter', type: 'toggle' },
			{ key: 'feedback', label: 'Feedback', type: 'toggle' },
			{ key: 'careers', label: 'Careers', type: 'toggle' },
			{ key: 'analytics', label: 'Analytics', type: 'toggle' },
			{ key: 'emailCenter', label: 'Email Center', type: 'toggle' }
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
	},
	{
		id: 'seo',
		label: 'SEO',
		description: 'Search engine and social sharing metadata.',
		fields: [
			{ key: 'siteTitle', label: 'Site Title', type: 'text', required: true },
			{ key: 'defaultDescription', label: 'Default Description', type: 'textarea' },
			{ key: 'keywords', label: 'Keywords', type: 'tags', help: 'Press Enter to add a keyword.' },
			{ key: 'ogTitle', label: 'Open Graph Title', type: 'text' },
			{ key: 'ogDescription', label: 'Open Graph Description', type: 'textarea' },
			{ key: 'robots', label: 'Robots', type: 'select', options: ROBOTS_OPTIONS },
			{ key: 'canonicalUrl', label: 'Canonical URL', type: 'url', placeholder: 'https://…' }
		]
	},
	{
		id: 'legal',
		label: 'Legal',
		description: 'Company legal details and policy links.',
		fields: [
			{ key: 'companyName', label: 'Company Name', type: 'text', required: true },
			{ key: 'companyAddress', label: 'Company Address', type: 'textarea' },
			{ key: 'gstNumber', label: 'GST Number', type: 'text' },
			{
				key: 'privacyPolicyUrl',
				label: 'Privacy Policy URL',
				type: 'url',
				placeholder: 'https://…'
			},
			{ key: 'termsUrl', label: 'Terms URL', type: 'url', placeholder: 'https://…' },
			{ key: 'refundPolicyUrl', label: 'Refund Policy URL', type: 'url', placeholder: 'https://…' },
			{ key: 'supportUrl', label: 'Support URL', type: 'url', placeholder: 'https://…' }
		]
	}
];
