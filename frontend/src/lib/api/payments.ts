/**
 * Payments API Client
 *
 * Communicates with the backend payment endpoints.
 * All API communication goes through this module —
 * pages never call fetch() directly for reusable APIs.
 */

import type { CreateOrderResponse, VerifyPaymentResponse, PaymentError } from '$lib/types/payment';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Create a Razorpay order for a product purchase.
 * The backend determines the price from the database.
 */
export async function createOrder(
  productSlug: string,
  email: string
): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/api/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productSlug, email }),
  });

  if (!response.ok) {
    const error: PaymentError = await response.json();
    throw new Error(error.message || 'Failed to create order');
  }

  return response.json();
}

/**
 * Verify a Razorpay payment after successful checkout.
 * The backend verifies the HMAC signature and grants entitlement.
 */
export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifyPaymentResponse> {
  const response = await fetch(`${API_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),
  });

  if (!response.ok) {
    const error: PaymentError = await response.json();
    throw new Error(error.message || 'Payment verification failed');
  }

  return response.json();
}
