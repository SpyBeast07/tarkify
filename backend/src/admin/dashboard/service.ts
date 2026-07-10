import { config } from '../../config.js';
import * as dashboardRepository from './repository.js';
import type { DashboardResponse, SystemHealth } from './types.js';

export async function getDashboard(): Promise<DashboardResponse> {
  const [
    revenue,
    orders,
    customers,
    downloads,
    products,
    recentOrders,
    recentContacts,
    recentFeedback,
    recentCareers,
    recentEmails,
    recentActivity,
    dbOk,
  ] = await Promise.all([
    dashboardRepository.getRevenueSummary(),
    dashboardRepository.getOrdersCount(),
    dashboardRepository.getCustomerSummary(),
    dashboardRepository.getDownloadsSummary(),
    dashboardRepository.getProductsSummary(),
    dashboardRepository.getRecentOrders(),
    dashboardRepository.getRecentContacts(),
    dashboardRepository.getRecentFeedback(),
    dashboardRepository.getRecentCareers(),
    dashboardRepository.getRecentEmails(),
    dashboardRepository.getRecentActivity(),
    dashboardRepository.testDatabaseConnection(),
  ]);

  const systemHealth: SystemHealth = {
    backend: 'healthy',
    database: dbOk ? 'healthy' : 'offline',
    email: config.email.resendApiKey ? 'healthy' : 'offline',
    payments: config.razorpay.keyId ? 'healthy' : 'offline',
    storage: 'healthy',
    oauth: config.googleOAuthEnabled ? 'healthy' : 'offline',
  };

  return {
    summary: {
      revenue: {
        total: revenue.total,
        paidOrders: revenue.paid_orders,
        pendingPayments: revenue.pending_payments,
        failedPayments: revenue.failed_payments,
      },
      orders: { total: orders.total },
      customers: {
        total: customers.total,
        verified: customers.verified,
        unverified: customers.unverified,
        newThisMonth: customers.new_this_month,
      },
      downloads: {
        total: downloads.total,
        activeTokens: downloads.active_tokens,
        expiredTokens: downloads.expired_tokens,
        today: downloads.today,
      },
      products: {
        published: products.published,
        inactive: products.inactive,
        latest: products.latest ?? null,
      },
    },
    recentOrders,
    recentContacts,
    recentFeedback,
    recentCareers,
    recentEmails,
    recentActivity,
    systemHealth,
  };
}
