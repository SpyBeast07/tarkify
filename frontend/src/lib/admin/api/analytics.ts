import { adminFetch, AdminApiError } from './client';
import type {
  AnalyticsOverview,
  RevenueAnalytics,
  OrdersAnalytics,
  DownloadsAnalytics,
  ProductsAnalytics,
  CustomersAnalytics,
  EmailsAnalytics,
  TrafficAnalytics,
  GrowthAnalytics,
} from '$lib/admin/types/analytics';

export type AnalyticsRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface AnalyticsQuery {
  range?: AnalyticsRange;
  start?: string;
  end?: string;
}

function buildRange(q: AnalyticsQuery): string {
  const sp = new URLSearchParams();
  if (q.range) sp.set('range', q.range);
  if (q.start) sp.set('start', q.start);
  if (q.end) sp.set('end', q.end);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export async function getOverview(q: AnalyticsQuery = {}): Promise<AnalyticsOverview> {
  return adminFetch<AnalyticsOverview>(`/analytics/overview${buildRange(q)}`);
}

export async function getRevenue(q: AnalyticsQuery = {}): Promise<RevenueAnalytics> {
  return adminFetch<RevenueAnalytics>(`/analytics/revenue${buildRange(q)}`);
}

export async function getOrders(q: AnalyticsQuery = {}): Promise<OrdersAnalytics> {
  return adminFetch<OrdersAnalytics>(`/analytics/orders${buildRange(q)}`);
}

export async function getDownloads(q: AnalyticsQuery = {}): Promise<DownloadsAnalytics> {
  return adminFetch<DownloadsAnalytics>(`/analytics/downloads${buildRange(q)}`);
}

export async function getProducts(q: AnalyticsQuery = {}): Promise<ProductsAnalytics> {
  return adminFetch<ProductsAnalytics>(`/analytics/products${buildRange(q)}`);
}

export async function getCustomers(q: AnalyticsQuery = {}): Promise<CustomersAnalytics> {
  return adminFetch<CustomersAnalytics>(`/analytics/customers${buildRange(q)}`);
}

export async function getEmails(q: AnalyticsQuery = {}): Promise<EmailsAnalytics> {
  return adminFetch<EmailsAnalytics>(`/analytics/emails${buildRange(q)}`);
}

export async function getGrowth(q: AnalyticsQuery = {}): Promise<GrowthAnalytics> {
  return adminFetch<GrowthAnalytics>(`/analytics/growth${buildRange(q)}`);
}

export async function getTraffic(q: AnalyticsQuery = {}): Promise<TrafficAnalytics> {
  return adminFetch<TrafficAnalytics>(`/analytics/traffic${buildRange(q)}`);
}

export { AdminApiError };
