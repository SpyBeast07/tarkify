export interface BootstrapResult {
  action: 'created' | 'updated' | 'unchanged' | 'extra_admins_revoked';
  detail: string;
}

export interface BootstrapAdminConfig {
  name: string;
  email: string;
  password: string;
}

export interface BootstrapAdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  account_status: string;
  email_verified: boolean;
}

export interface AdminAccount {
  id: string;
  user_id: string;
  provider_id: string;
  password: string | null;
}
