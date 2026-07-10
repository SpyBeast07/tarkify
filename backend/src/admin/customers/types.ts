export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface CustomerListItem {
  id: string;
  name: string | null;
  email: string;
  display_name: string | null;
  image: string | null;
  account_status: AccountStatus;
  email_verified: boolean;
  oauth_providers: string[];
  purchases_count: number;
  downloads_count: number;
  last_login_at: string | null;
  created_at: string;
}

export interface CustomerDetail {
  id: string;
  email: string;
  name: string | null;
  display_name: string | null;
  image: string | null;
  timezone: string | null;
  preferences: Record<string, unknown>;
  role: string;
  account_status: AccountStatus;
  email_verified: boolean;
  last_login_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  has_password: boolean;
  oauth_accounts: OAuthAccountInfo[];
}

export interface OAuthAccountInfo {
  provider_id: string;
  account_id: string;
  created_at: string;
}

export interface CustomerSession {
  id: string;
  user_id: string;
  token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
  expires_at: string;
  last_seen: string | null;
  is_current: boolean;
}

export interface CustomerPurchase {
  id: string;
  product_name: string;
  product_slug: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface CustomerDownload {
  id: string;
  token: string;
  purchase_id: string;
  product_name: string;
  expires_at: string;
  created_at: string;
}

export interface CustomerAuditEntry {
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CustomerActivityEntry {
  id: string;
  event: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CustomerListParams {
  search?: string;
  status?: AccountStatus;
  emailVerified?: boolean;
  oauth?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'name' | 'last_login' | 'purchases';
  page?: number;
  perPage?: number;
}

export interface CustomerFilterOptions {
  statuses: AccountStatus[];
}

export interface CustomerDetailResponse {
  customer: CustomerDetail;
  purchases: CustomerPurchase[];
  downloads: CustomerDownload[];
  sessions: CustomerSession[];
  activity: CustomerActivityEntry[];
  audit: CustomerAuditEntry[];
}
