/**
 * Razorpay Service
 *
 * Isolates all Razorpay SDK and API interactions.
 * Handles order creation, payment signature verification,
 * and webhook signature verification.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config.js';
import type { RazorpayOrder } from '../types/index.js';

const razorpayInstance = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * Create a Razorpay Order.
 *
 * @param amount - Amount in smallest currency unit (paise for INR)
 * @param currency - ISO currency code (e.g., 'INR')
 * @param receipt - Unique receipt identifier for this order
 */
export async function createOrder(
  amount: number,
  currency: string,
  receipt: string
): Promise<RazorpayOrder> {
  const order = await razorpayInstance.orders.create({
    amount,
    currency,
    receipt,
  });

  return order as unknown as RazorpayOrder;
}

/**
 * Verify the payment signature returned by Razorpay Checkout.
 * Uses HMAC SHA256 with the key secret to verify authenticity.
 *
 * The signature is computed over: orderId|paymentId
 * This ensures the payment genuinely belongs to the order.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * Verify the webhook signature sent by Razorpay.
 * Uses HMAC SHA256 with the webhook secret.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
}

/**
 * Get the Razorpay public key (safe to send to the frontend).
 */
export function getPublicKey(): string {
  return config.razorpay.keyId;
}
