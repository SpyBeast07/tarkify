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

export type SettingsValueMap = {
  payments: PaymentsSettings;
  notifications: NotificationsSettings;
};

export type AllSettings = SettingsValueMap;

export interface SettingsRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

export const DEFAULT_SETTINGS: SettingsValueMap = {
  payments: {
    maintenanceMode: false,
    taxEnabled: false,
  },
  notifications: {
    adminEmailAlerts: true,
    paymentAlerts: true,
    feedbackAlerts: true,
    contactAlerts: true,
    careerAlerts: true,
    newsletterAlerts: true,
    systemAlerts: true,
  },
};

export const SETTINGS_GROUPS: SettingsGroup[] = [
  'payments',
  'notifications'
];

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
  payments: 'Payments',
  notifications: 'Notifications'
};
