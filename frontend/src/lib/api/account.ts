const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3009").replace(/\/+$/, "");
export const API_ORIGIN = API_BASE;
const ACCOUNT_BASE = `${API_BASE}/api/account`;
const REQUEST_TIMEOUT_MS = 15_000;

export type ApiErrorBody = {
  error: { message: string; code?: string };
  status: number;
};

async function accountFetch<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T | ApiErrorBody> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${ACCOUNT_BASE}${path}`, {
      method: opts.method || "GET",
      headers: {
        "Accept": "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: "Request failed" }));
      return { error: errorBody, status: response.status };
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return { error: { message: "Request timed out", code: "TIMEOUT" }, status: 0 };
    }
    if (err instanceof TypeError) {
      return { error: { message: "Network error", code: "NETWORK_ERROR" }, status: 0 };
    }
    if (err instanceof SyntaxError) {
      return { error: { message: "Invalid server response", code: "PARSE_ERROR" }, status: 0 };
    }
    return { error: { message: "Request failed", code: "UNKNOWN" }, status: 0 };
  }
}

export interface DashboardData {
  summary: {
    name: string;
    email: string;
    role: string;
    accountStatus: string;
  };
  totalPurchases: number;
  activeDownloads: number;
  recentActivity: Array<{
    purchaseId: string;
    productName: string;
    productSlug: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  accountStatus: string;
  memberSince: string;
}

export interface PurchaseRow {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  payment_provider: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PurchasesResponse {
  purchases: PurchaseRow[];
  pagination: PaginationMeta;
}

export interface DownloadRow {
  entitlement_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  purchase_id: string;
  purchase_status: string;
  granted_at: string;
  has_valid_token: boolean;
}

export interface DownloadsResponse {
  downloads: DownloadRow[];
}

export interface BillingRow {
  id: string;
  product_name: string;
  product_slug: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
}

export interface BillingResponse {
  payments: BillingRow[];
  pagination: PaginationMeta;
}

export interface TokenResponse {
  token: string;
  expiresAt: string;
  downloadUrl: string;
}

export interface ProfileData {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    name: string | null;
    image: string | null;
    role: string;
    timezone: string | null;
    preferences: Record<string, unknown>;
    accountStatus: string;
    emailVerified: boolean;
    lastLoginAt: string | null;
    lastActivityAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export async function fetchDashboard(): Promise<DashboardData | ApiErrorBody> {
  return accountFetch<DashboardData>("/dashboard");
}

export async function fetchPurchases(page = 1, limit = 20): Promise<PurchasesResponse | ApiErrorBody> {
  return accountFetch<PurchasesResponse>(`/purchases?page=${page}&limit=${limit}`);
}

export async function fetchPurchase(id: string): Promise<{ purchase: PurchaseRow } | ApiErrorBody> {
  return accountFetch<{ purchase: PurchaseRow }>(`/purchases/${id}`);
}

export async function fetchDownloads(): Promise<DownloadsResponse | ApiErrorBody> {
  return accountFetch<DownloadsResponse>("/downloads");
}

export async function generateDownloadToken(purchaseId: string): Promise<TokenResponse | ApiErrorBody> {
  return accountFetch<TokenResponse>(`/downloads/${purchaseId}`, { method: "POST" });
}

export async function fetchBilling(page = 1, limit = 20): Promise<BillingResponse | ApiErrorBody> {
  return accountFetch<BillingResponse>(`/billing?page=${page}&limit=${limit}`);
}

export async function fetchProfile(): Promise<ProfileData | null> {
  const result = await accountFetch<ProfileData>("/profile");
  if ('error' in result) return null;
  return result;
}

export async function updateProfile(data: { displayName?: string; timezone?: string }): Promise<{ message: string; user: ProfileData['user'] } | ApiErrorBody> {
  return accountFetch<{ message: string; user: ProfileData['user'] }>("/profile", {
    method: "PUT",
    body: data,
  });
}
