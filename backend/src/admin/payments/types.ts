export type PurchaseStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface PaymentListItem {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  customer_name: string | null;
  customer_email: string;
  product_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: PurchaseStatus;
  payment_provider: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDetail {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  customer_name: string | null;
  customer_email: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  payment_provider: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: PurchaseStatus;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentListResponse {
  payments: PaymentListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaymentListParams {
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

export interface PaymentAuditEntry {
  id: string;
  event: string;
  user_id: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RefundInfo {
  status: 'refunded' | 'not_refunded';
  refunded_at: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
}

export interface ReceiptInfo {
  receipt_number: string;
  purchase_date: string;
  amount: number;
  currency: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string;
  product_name: string;
  customer_email: string;
  customer_name: string | null;
}
