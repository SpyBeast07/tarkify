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
    enablePayments: true,
    maintenanceMode: false,
    acceptedCurrency: 'INR',
    taxEnabled: false,
    receiptPrefix: 'INV-',
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
};

export const SETTINGS_GROUPS: SettingsGroup[] = [
  'payments',
  'notifications'
];

export const SETTINGS_GROUP_LABELS: Record<SettingsGroup, string> = {
  payments: 'Payments',
  notifications: 'Notifications'
};
