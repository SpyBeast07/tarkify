export type AnalyticsRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface RevenueBreakdown {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  averageOrderValue: number;
}

export interface RevenueAnalytics extends RevenueBreakdown {
  trend: TimeSeriesPoint[];
}

export interface OrdersBreakdown {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  conversionRate: number;
}

export interface OrdersAnalytics extends OrdersBreakdown {
  daily: TimeSeriesPoint[];
}

export interface DownloadsBreakdown {
  total: number;
  unique: number;
  activeTokens: number;
  expiredTokens: number;
}

export interface ProductCount {
  product: string;
  productId: string;
  count: number;
  revenue: number;
}

export interface DownloadsAnalytics extends DownloadsBreakdown {
  perProduct: ProductCount[];
  trend: TimeSeriesPoint[];
}

export interface ProductsBreakdown {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export interface TopProduct {
  product: string;
  productId: string;
  orders: number;
  revenue: number;
}

export interface DownloadProduct {
  product: string;
  productId: string;
  downloads: number;
}

export interface ProductsAnalytics extends ProductsBreakdown {
  topSelling: TopProduct[];
  mostDownloaded: DownloadProduct[];
}

export interface CustomersBreakdown {
  total: number;
  verified: number;
  unverified: number;
  oauth: number;
  newCustomers: number;
  returning: number;
}

export interface CustomersAnalytics extends CustomersBreakdown {
  trend: TimeSeriesPoint[];
}

export interface EmailsBreakdown {
  sent: number;
  failed: number;
  queued: number;
  successRate: number;
}

export interface EmailTypeCount {
  type: string;
  count: number;
}

export interface EmailsAnalytics extends EmailsBreakdown {
  daily: TimeSeriesPoint[];
  byType: EmailTypeCount[];
}

export interface TrafficCategory {
  category: string;
  count: number;
}

export interface TrafficAnalytics {
  purchases: number;
  downloads: number;
  contacts: number;
  feedback: number;
  newsletter: number;
  careers: number;
  logins: number;
  byCategory: TrafficCategory[];
}

export interface GrowthMetric {
  current: number;
  previous: number;
  deltaPct: number;
}

export interface GrowthAnalytics {
  revenue: GrowthMetric;
  customers: GrowthMetric;
  orders: GrowthMetric;
  downloads: GrowthMetric;
}

export interface OverviewKpis {
  revenue: number;
  orders: number;
  customers: number;
  downloads: number;
  products: number;
  emails: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface AnalyticsOverview extends OverviewKpis {}
