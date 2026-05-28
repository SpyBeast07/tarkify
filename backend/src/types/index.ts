/**
 * Shared TypeScript interfaces for the purchase system.
 * Used across services and routes.
 */

// ── Database Models ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
}

export type ProductType = 'ONE_TIME' | 'SUBSCRIPTION';

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: ProductType;
  price: number;
  currency: string;
  download_key: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PurchaseStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface Purchase {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  product_id: string;
  payment_provider: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  status: PurchaseStatus;
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Entitlement {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  product_id: string;
  purchase_id: string;
  granted_at: Date;
  revoked_at: Date | null;
}

// ── API Request/Response Types ───────────────────────────────────

export interface CreateOrderRequest {
  productSlug: string;
  email: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  productName: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
}

export interface ProductResponse {
  slug: string;
  name: string;
  description: string | null;
  type: ProductType;
  price: number;
  currency: string;
  active: boolean;
}

export interface ApiError {
  error: string;
  message: string;
}

// ── Razorpay Types ───────────────────────────────────────────────

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        email?: string;
      };
    };
  };
}
