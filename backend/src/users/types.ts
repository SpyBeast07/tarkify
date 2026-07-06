export const ROLES = ['customer', 'admin', 'super_admin'] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface TarkifyUser {
  id: string;
  email: string;
  role: Role;
  display_name: string | null;
  timezone: string | null;
  preferences: Record<string, unknown>;
  last_login_at: string | null;
  last_activity_at: string | null;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  role: Role;
  timezone: string | null;
  preferences: Record<string, unknown>;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  timezone?: string;
}

export interface ActivityUpdate {
  lastLoginAt?: string;
  lastActivityAt?: string;
}
