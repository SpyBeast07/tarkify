import { API_BASE } from './config';
import { accountFetch } from './fetch';

export type { ApiErrorBody } from './fetch';
export const API_ORIGIN = API_BASE;

// ── Types ────────────────────────────────────────────────────────

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
    taxAmount: number;
    totalAmount: number;
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
  tax_amount: number;
  total_amount: number;
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
  tax_amount: number;
  total_amount: number;
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

// ── API Functions ────────────────────────────────────────────────

export async function fetchDashboard() {
  return accountFetch<DashboardData>("/dashboard");
}

export async function fetchPurchases(page = 1, limit = 20) {
  return accountFetch<PurchasesResponse>(`/purchases?page=${page}&limit=${limit}`);
}

export async function fetchPurchase(id: string) {
  return accountFetch<{ purchase: PurchaseRow }>(`/purchases/${id}`);
}

export async function fetchDownloads() {
  return accountFetch<DownloadsResponse>("/downloads");
}

export async function generateDownloadToken(purchaseId: string) {
  return accountFetch<TokenResponse>(`/downloads/${purchaseId}`, { method: "POST" });
}

export async function fetchBilling(page = 1, limit = 20) {
  return accountFetch<BillingResponse>(`/billing?page=${page}&limit=${limit}`);
}

export async function fetchProfile(): Promise<ProfileData | null> {
  const result = await accountFetch<ProfileData>("/profile");
  if ('error' in result) return null;
  return result;
}

export async function updateProfile(data: { displayName?: string; timezone?: string }) {
  return accountFetch<{ message: string; user: ProfileData['user'] }>("/profile", {
    method: "PUT",
    body: data,
  });
}
