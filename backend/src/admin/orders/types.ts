export type PurchaseStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface OrderListItem {
  id: string;
  customer_name: string | null;
  customer_email: string;
  product_name: string;
  product_slug: string;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  payment_provider: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  customer_name: string | null;
  customer_email: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_description: string | null;
  payment_provider: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: PurchaseStatus;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  orders: OrderListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface OrderListParams {
  search?: string;
  status?: PurchaseStatus;
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  product?: string;
  sort?: 'newest' | 'oldest' | 'amount' | 'status';
  page?: number;
  perPage?: number;
}

export interface OrderEntitlement {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  product_id: string;
  purchase_id: string;
  granted_at: string;
  revoked_at: string | null;
}

export interface OrderDownloadToken {
  id: string;
  token: string;
  purchase_id: string;
  product_id: string;
  expires_at: string;
  created_at: string;
}

export interface OrderEmailLog {
  id: string;
  recipient: string;
  template: string;
  provider: string;
  status: string;
  error: string | null;
  sent_at: string;
  metadata: Record<string, unknown>;
}

export interface OrderAuditEntry {
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
