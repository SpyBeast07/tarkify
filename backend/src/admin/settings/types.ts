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

export type SettingsValueMap = {
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
};

export type AllSettings = SettingsValueMap;

export interface SettingsRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

const EMPTY_SOCIAL: SocialLink[] = [];
const EMPTY_KEYWORDS: string[] = [];

export const DEFAULT_SETTINGS: SettingsValueMap = {
  brand: {
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#7b904b',
    secondaryColor: '#6366f1',
    companyDescription: '',
    socialLinks: EMPTY_SOCIAL,
  },
  email: {
    defaultFromName: 'Tarkify',
    replyToName: 'Tarkify Support',
    adminNotificationEmail: 'admin@tarkify.qzz.io',
    emailFooter: '© Tarkify. All rights reserved.',
    signature: '— The Tarkify Team',
    enableEmailSending: true,
    enableTestEmails: false,
  },
  payments: {
    enablePayments: true,
    maintenanceMode: false,
    acceptedCurrency: 'INR',
    taxEnabled: false,
    receiptPrefix: 'INV-',
  },
  oauth: {
    enableGoogleLogin: false,
    enableAccountLinking: true,
    allowEmailSignup: true,
    requireEmailVerification: true,
  },
  security: {
    passwordPolicy: 'medium',
    minimumLength: 8,
    requireNumbers: true,
    requireSymbols: false,
    sessionTimeout: 60,
    maximumSessions: 5,
    accountLockout: true,
    rateLimitingEnabled: true,
  },
  storage: {
    storageProvider: 'local',
    maximumUploadSize: 25,
    downloadExpiry: 600,
    cleanupSchedule: 'weekly',
    retentionDays: 90,
  },
  features: {
    customerPortal: true,
    adminPortal: true,
    downloads: true,
    newsletter: true,
    feedback: true,
    careers: true,
    analytics: true,
    emailCenter: true,
  },
  notifications: {
    adminEmailAlerts: true,
    paymentAlerts: true,
    downloadAlerts: true,
    contactAlerts: true,
    careerAlerts: true,
    newsletterAlerts: true,
    systemAlerts: true,
  },
  seo: {
    siteTitle: 'Tarkify',
    defaultDescription: '',
    keywords: EMPTY_KEYWORDS,
    ogTitle: '',
    ogDescription: '',
    robots: 'index,follow',
    canonicalUrl: '',
  },
  legal: {
    companyName: 'Tarkify',
    companyAddress: '',
    gstNumber: '',
    privacyPolicyUrl: '',
    termsUrl: '',
    refundPolicyUrl: '',
    supportUrl: '',
  },
};

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
  'legal',
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
  legal: 'Legal',
};
