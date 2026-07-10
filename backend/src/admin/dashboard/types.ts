export interface DashboardSummary {
  revenue: {
    total: number;
    paidOrders: number;
    pendingPayments: number;
    failedPayments: number;
  };
  orders: {
    total: number;
  };
  customers: {
    total: number;
    verified: number;
    unverified: number;
    newThisMonth: number;
  };
  downloads: {
    total: number;
    activeTokens: number;
    expiredTokens: number;
    today: number;
  };
  products: {
    published: number;
    inactive: number;
    latest: { id: string; name: string; slug: string; created_at: string } | null;
  };
}

export interface RecentOrder {
  id: string;
  customer: string | null;
  email: string | null;
  product: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface RecentContact {
  id: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
}

export interface RecentFeedback {
  id: string;
  name: string | null;
  product: string;
  rating: number;
  status: string;
  created_at: string;
}

export interface RecentCareer {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export interface RecentEmail {
  id: string;
  recipient: string;
  template: string;
  status: string;
  sent_at: string;
}

export interface RecentActivity {
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SystemHealth {
  backend: 'healthy';
  database: 'healthy' | 'warning' | 'offline';
  email: 'healthy' | 'warning' | 'offline';
  payments: 'healthy' | 'warning' | 'offline';
  storage: 'healthy' | 'warning' | 'offline';
  oauth: 'healthy' | 'offline';
}

export interface DashboardResponse {
  summary: DashboardSummary;
  recentOrders: RecentOrder[];
  recentContacts: RecentContact[];
  recentFeedback: RecentFeedback[];
  recentCareers: RecentCareer[];
  recentEmails: RecentEmail[];
  recentActivity: RecentActivity[];
  systemHealth: SystemHealth;
}
