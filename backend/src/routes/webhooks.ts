/**
 * Razorpay Webhook Handler
 *
 * POST /api/webhooks/razorpay
 *
 * Provides a reliable, server-to-server backup for payment completion.
 * Even if the user's browser closes or the frontend callback fails,
 * the webhook ensures the purchase is completed and entitlement granted.
 *
 * Idempotent: safe to receive duplicate webhook events.
 */

import { Hono } from 'hono';
import * as razorpayService from '../services/razorpay.service.js';
import * as purchaseService from '../services/purchase.service.js';
import type { RazorpayWebhookPayload } from '../types/index.js';

const webhooks = new Hono();

webhooks.post('/razorpay', async (c) => {
  // Read raw body for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header('x-razorpay-signature');

  if (!signature) {
    console.error('Webhook received without signature header');
    return c.json({ error: 'Missing signature' }, 400);
  }

  // Verify webhook signature
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

  // Only handle payment.captured events
  if (payload.event !== 'payment.captured') {
    return c.json({ status: 'ignored', event: payload.event });
  }

  const paymentEntity = payload.payload.payment.entity;
  const { id: paymentId, order_id: orderId } = paymentEntity;

  if (!orderId || !paymentId) {
    console.error('Webhook payload missing order_id or payment id');
    return c.json({ error: 'Missing required fields in payload' }, 400);
  }

  // Find the purchase record
  const purchase = await purchaseService.getPurchaseByOrderId(orderId);
  if (!purchase) {
    console.error('Webhook received for unknown order:', orderId);
    return c.json({ status: 'order_not_found' }, 200);
  }

  // Already completed — acknowledge without error (idempotent)
  if (purchase.status === 'paid') {
    return c.json({ status: 'already_processed' });
  }

  // Complete the purchase
  const updated = await purchaseService.completePurchase(
    orderId,
    paymentId,
    `webhook_verified_${signature.substring(0, 16)}`
  );

  if (!updated) {
    console.error('Failed to complete purchase from webhook:', orderId);
    return c.json({ error: 'Failed to process' }, 500);
  }

  // Grant entitlement via guest_email (idempotent)
  if (purchase.guest_email) {
    await purchaseService.grantEntitlement(
      purchase.guest_email,
      purchase.product_id,
      purchase.id
    );
  }

  console.info(`Webhook: Purchase completed for ${purchase.guest_email} - product ${purchase.product_id}`);
  return c.json({ status: 'processed' });
});

export default webhooks;
