export const EMAIL_CATEGORIES = ['marketing', 'newsletter', 'product', 'security', 'billing'] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export interface EmailPreferences {
  marketing: boolean;
  newsletter: boolean;
  product: boolean;
  security: boolean;
  billing: boolean;
}

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  marketing: true,
  newsletter: true,
  product: true,
  security: true,
  billing: true,
};

export const MANDATORY_CATEGORIES: EmailCategory[] = ['security'];
