/**
 * Razorpay Webhook Handler
 *
 * POST /api/webhooks/razorpay
 *
 * Provides a reliable, server-to-server backup for payment completion.
 * Even if the user's browser closes or the frontend callback fails,
 * the webhook ensures the purchase is completed and entitlement granted.
 *
 * Handles:
 *   payment.captured — complete purchase + grant entitlement (idempotent)
 *   payment.refunded — mark purchase refunded + revoke entitlement
 *
 * Both paths are idempotent: duplicate webhook deliveries are safe.
 */

import { Hono } from 'hono';
import * as razorpayService from '../services/razorpay.service.js';
import * as purchaseService from '../services/purchase.service.js';
import type { RazorpayWebhookPayload } from '../types/index.js';

const webhooks = new Hono();

webhooks.post('/razorpay', async (c) => {
  // Read raw body for signature verification — must happen before any parsing.
  const rawBody = await c.req.text();
  const signature = c.req.header('x-razorpay-signature');

  if (!signature) {
    console.error('Webhook received without signature header');
    return c.json({ error: 'Missing signature' }, 400);
  }

  // Verify webhook signature using HMAC SHA256.
  // verifyWebhookSignature safely returns false on malformed input.
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.error('Webhook signature verification failed');
    return c.json({ error: 'Invalid signature' }, 400);
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    console.error('Failed to parse webhook payload');
    return c.json({ error: 'Invalid payload' }, 400);
  }

  const { event } = payload;

  // ── payment.captured ──────────────────────────────────────────
  if (event === 'payment.captured') {
    const paymentEntity = payload.payload.payment.entity;
    const { id: paymentId, order_id: orderId } = paymentEntity;

    if (!orderId || !paymentId) {
      console.error('Webhook payment.captured: missing order_id or payment id');
      return c.json({ error: 'Missing required fields in payload' }, 400);
    }

    // Find the purchase record.
    const purchase = await purchaseService.getPurchaseByOrderId(orderId);
    if (!purchase) {
      // Razorpay can deliver webhooks for orders not originated by us
      // (e.g. test mode). Return 200 so Razorpay stops retrying.
      console.warn(`Webhook payment.captured: unknown order ${orderId}`);
      return c.json({ status: 'order_not_found' }, 200);
    }

    // Already completed — acknowledge without re-processing (idempotent).
    if (purchase.status === 'paid') {
      return c.json({ status: 'already_processed' });
    }

    try {
      // Compute the genuine payment signature ourselves. The webhook HMAC
      // is computed over the raw body using the webhook secret, which is
      // different from the payment signature (orderId|paymentId with key_secret).
      const paymentSignature = razorpayService.computePaymentSignature(orderId, paymentId);

      const updated = await purchaseService.completePurchaseAndGrantEntitlement(
        orderId,
        paymentId,
        paymentSignature
      );

      if (!updated) {
        console.error(`Webhook payment.captured: failed to complete purchase ${orderId}`);
        return c.json({ error: 'Failed to process' }, 500);
      }

      console.info(
        `Webhook payment.captured: purchase=${updated.id} order=${orderId} payment=${paymentId}`
      );
      return c.json({ status: 'processed' });
    } catch (error) {
      console.error(`Webhook payment.captured: error for order ${orderId}`, error);
      return c.json({ error: 'Failed to process' }, 500);
    }
  }

  // ── payment.refunded ──────────────────────────────────────────
  if (event === 'payment.refunded') {
    const paymentEntity = payload.payload.payment.entity;
    const { order_id: orderId } = paymentEntity;

    if (!orderId) {
      console.error('Webhook payment.refunded: missing order_id');
      return c.json({ error: 'Missing required fields in payload' }, 400);
    }

    const purchase = await purchaseService.getPurchaseByOrderId(orderId);
    if (!purchase) {
      console.warn(`Webhook payment.refunded: unknown order ${orderId}`);
      return c.json({ status: 'order_not_found' }, 200);
    }

    // Already refunded — idempotent.
    if (purchase.status === 'refunded') {
      return c.json({ status: 'already_refunded' });
    }

    try {
      // Atomically mark purchase refunded + revoke entitlement + expire tokens.
      const updated = await purchaseService.refundPurchase(orderId);

      if (!updated) {
        console.error(`Webhook payment.refunded: failed to refund purchase ${orderId}`);
        return c.json({ error: 'Failed to process refund' }, 500);
      }

      console.info(
        `Webhook payment.refunded: purchase=${updated.id} order=${orderId}`
      );
      return c.json({ status: 'refund_processed' });
    } catch (error) {
      console.error(`Webhook payment.refunded: error for order ${orderId}`, error);
      return c.json({ error: 'Failed to process refund' }, 500);
    }
  }

  // Unhandled event — acknowledge to prevent Razorpay retry spam.
  return c.json({ status: 'ignored', event });
});

export default webhooks;
