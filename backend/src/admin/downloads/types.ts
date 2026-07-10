export type DownloadTokenStatus = 'active' | 'expired' | 'revoked';

export interface DownloadListItem {
  id: string;
  token: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  customer_name: string | null;
  customer_email: string;
  status: DownloadTokenStatus;
  created_at: string;
  expires_at: string;
  tokens_count: number;
}

export interface DownloadDetail {
  id: string;
  token: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  customer_name: string | null;
  customer_email: string;
  customer_id: string | null;
  status: DownloadTokenStatus;
  created_at: string;
  expires_at: string;
  tokens_count: number;
}

export interface DownloadHistoryEntry {
  id: string;
  event: string;
  description: string;
  user_name: string | null;
  created_at: string;
}

export interface DownloadAuditEntry {
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DownloadListResponse {
  downloads: DownloadListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface DownloadListParams {
  search?: string;
  status?: DownloadTokenStatus;
  product?: string;
  sort?: 'newest' | 'oldest' | 'expires' | 'downloads';
  page?: number;
  perPage?: number;
}

export interface DownloadDetailResponse {
  download: DownloadDetail;
  history: DownloadHistoryEntry[];
  audit: DownloadAuditEntry[];
}

export interface DownloadFilterOptions {
  products: { id: string; name: string }[];
}
