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
 * Generate a Razorpay-safe receipt ID.
 *
 * Razorpay limits receipt IDs to 40 characters.
 * We produce: "r_" + first 6 chars of slug + "_" + 8 hex chars from a random value.
 * Maximum length: 2 + 6 + 1 + 8 = 17 characters — always well within the limit.
 *
 * Using crypto.randomBytes for unpredictability (not for security — Razorpay
 * itself enforces order integrity via signatures).
 */
export function generateReceipt(productSlug: string): string {
  const slugPrefix = productSlug.slice(0, 6).replace(/[^a-z0-9]/gi, '');
  const rand = crypto.randomBytes(4).toString('hex'); // 8 hex chars
  return `r_${slugPrefix}_${rand}`;
}

/**
 * Create a Razorpay Order.
 *
 * @param amount - Amount in smallest currency unit (paise for INR)
 * @param currency - ISO currency code (e.g., 'INR')
 * @param receipt - Unique receipt identifier for this order (max 40 chars)
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
 *
 * HARDENED: timingSafeEqual throws if buffers have different lengths.
 * We catch that and return false so the caller always gets a boolean.
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

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    // timingSafeEqual throws if buffers have different lengths (malformed input)
    return false;
  }
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
 * Compute the payment signature expected from Razorpay Checkout.
 *
 * The signature is: HMAC_SHA256(orderId|paymentId, keySecret)
 * This is the same computation used in verifyPaymentSignature, exported
 * separately so webhook handlers can store the correct payment signature
 * without relying on the webhook HMAC (which is different).
 */
export function computePaymentSignature(orderId: string, paymentId: string): string {
  const body = `${orderId}|${paymentId}`;
  return crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');
}

/**
 * Get the Razorpay public key (safe to send to the frontend).
 */
export function getPublicKey(): string {
  return config.razorpay.keyId;
}
