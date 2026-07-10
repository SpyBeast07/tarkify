import * as repo from './repository.js';
import { resolveRange, type AnalyticsQuery } from './validation.js';
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
} from './types.js';

function rangeOf(q: AnalyticsQuery) {
  return resolveRange(q.range, q.start, q.end);
}

export async function getOverview(q: AnalyticsQuery): Promise<AnalyticsOverview> {
  const r = rangeOf(q);
  const [rev, ord, cust, dl, prod, em] = await Promise.all([
    repo.getRevenueSummary(r.start, r.end),
    repo.getOrdersSummary(r.start, r.end),
    repo.getCustomersSummary(r.start, r.end),
    repo.getDownloadsSummary(r.start, r.end),
    repo.getProductsSummary(),
    repo.getEmailsSummary(r.start, r.end),
  ]);
  return {
    revenue: rev.paid,
    orders: ord.total,
    customers: cust.newCustomers,
    downloads: dl.total,
    products: prod.total,
    emails: em.sent,
    conversionRate: ord.conversionRate,
    averageOrderValue: rev.averageOrderValue,
  };
}

export async function getRevenue(q: AnalyticsQuery): Promise<RevenueAnalytics> {
  const r = rangeOf(q);
  return repo.getRevenueAnalytics(r.start, r.end, r.bucket);
}

export async function getOrders(q: AnalyticsQuery): Promise<OrdersAnalytics> {
  const r = rangeOf(q);
  return repo.getOrdersAnalytics(r.start, r.end, r.bucket);
}

export async function getDownloads(q: AnalyticsQuery): Promise<DownloadsAnalytics> {
  const r = rangeOf(q);
  return repo.getDownloadsAnalytics(r.start, r.end, r.bucket);
}

export async function getProducts(q: AnalyticsQuery): Promise<ProductsAnalytics> {
  const r = rangeOf(q);
  return repo.getProductsAnalytics(r.start, r.end);
}

export async function getCustomers(q: AnalyticsQuery): Promise<CustomersAnalytics> {
  const r = rangeOf(q);
  return repo.getCustomersAnalytics(r.start, r.end, r.bucket);
}

export async function getEmails(q: AnalyticsQuery): Promise<EmailsAnalytics> {
  const r = rangeOf(q);
  return repo.getEmailsAnalytics(r.start, r.end, r.bucket);
}

export async function getTraffic(q: AnalyticsQuery): Promise<TrafficAnalytics> {
  const r = rangeOf(q);
  return repo.getTrafficAnalytics(r.start, r.end);
}

export async function getGrowth(q: AnalyticsQuery): Promise<GrowthAnalytics> {
  const cur = rangeOf(q);
  const lengthMs = cur.end.getTime() - cur.start.getTime();
  const prevEnd = cur.start;
  const prevStart = new Date(cur.start.getTime() - lengthMs);
  return repo.getGrowthAnalytics(cur.start, cur.end, prevStart, prevEnd);
}
