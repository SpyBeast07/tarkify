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
import type { Context } from 'hono';
import * as razorpayService from '../services/razorpay.service.js';
import * as productService from '../services/product.service.js';
import * as purchaseService from '../services/purchase.service.js';
import { emailService } from '../email/index.js';
import { config } from '../config.js';
import { razorpayWebhookPayloadSchema } from '../razorpay.validation.js';
import type { RazorpayWebhookPayload } from '../types/index.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

function webhookError(c: Context, error: string, message: string, status: ContentfulStatusCode) {
  return c.json({ error, message, requestId: (c as any).get('requestId') as string | undefined }, status);
}

const webhooks = new Hono();

webhooks.post('/razorpay', async (c) => {
  // Read raw body for signature verification — must happen before any parsing.
  const rawBody = await c.req.text();
  const signature = c.req.header('x-razorpay-signature');

  if (!signature) {
    console.error('Webhook received without signature header');
    return webhookError(c, 'WEBHOOK_SIGNATURE_MISSING', 'Request is missing the webhook signature header', 400);
  }

  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.error('Webhook signature verification failed');
    return webhookError(c, 'WEBHOOK_INVALID_SIGNATURE', 'Webhook signature verification failed', 400);
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = razorpayWebhookPayloadSchema.parse(JSON.parse(rawBody));
  } catch {
    console.error('Failed to parse webhook payload');
    return webhookError(c, 'WEBHOOK_INVALID_PAYLOAD', 'Failed to parse webhook payload', 400);
  }

  const { event } = payload;

  // ── payment.captured ──────────────────────────────────────────
  if (event === 'payment.captured') {
    const paymentEntity = payload.payload.payment.entity;
    const { id: paymentId, order_id: orderId } = paymentEntity;

    if (!orderId || !paymentId) {
      console.error('Webhook payment.captured: missing order_id or payment id');
      return webhookError(c, 'WEBHOOK_MISSING_FIELDS', 'Missing required fields in webhook payload', 400);
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
        return webhookError(c, 'WEBHOOK_PROCESSING_FAILED', 'Failed to process payment capture', 500);
      }

      // Generate download token if one does not already exist for this purchase.
      // This handles the case where the webhook fires before the frontend /verify:
      //   - Webhook completes purchase + grants entitlement
      //   - Webhook generates download token
      //   - Frontend /verify finds purchase already 'paid', looks up existing token,
      //     finds it, and returns it to the user
      // Without this, if webhook fires first, /verify returns 500 COMPLETION_FAILED
      // because no active token exists.
      const existingToken = await purchaseService.validateActiveTokenByPurchase(updated.id);
      if (!existingToken) {
        await purchaseService.generateDownloadToken(
          updated.id,
          updated.product_id
        );
        console.info(
          `Webhook: generated download token for purchase=${updated.id}`
        );
      }

      console.info(
        `Webhook payment.captured: purchase=${updated.id} order=${orderId} payment=${paymentId}`
      );

      const buyerEmail = updated.guest_email;
      if (buyerEmail) {
        productService.getProductById(updated.product_id).then((product) => {
          emailService.sendPurchaseReceipt({
            email: buyerEmail,
            productName: product?.name ?? 'Product',
            amount: updated.amount,
            currency: updated.currency,
            razorpayPaymentId: updated.razorpay_payment_id ?? '',
            razorpayOrderId: updated.razorpay_order_id,
            purchaseDate: formatPurchaseDate(updated.updated_at ?? updated.created_at),
            accountUrl: `${config.frontendUrl}/account`,
          }).catch((err) => console.error('[webhook] sendPurchaseReceipt failed:', err));
        }).catch(() => {});
      }

      return c.json({ status: 'processed' });
    } catch (error) {
      console.error(`Webhook payment.captured: error for order ${orderId}`, error);
      return webhookError(c, 'WEBHOOK_PROCESSING_FAILED', 'Failed to process payment capture', 500);
    }
  }

  // ── payment.refunded ──────────────────────────────────────────
  if (event === 'payment.refunded') {
    const paymentEntity = payload.payload.payment.entity;
    const { order_id: orderId } = paymentEntity;

    if (!orderId) {
      console.error('Webhook payment.refunded: missing order_id');
      return webhookError(c, 'WEBHOOK_MISSING_FIELDS', 'Missing required fields in webhook payload', 400);
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
        return webhookError(c, 'WEBHOOK_PROCESSING_FAILED', 'Failed to process refund', 500);
      }

      console.info(
        `Webhook payment.refunded: purchase=${updated.id} order=${orderId}`
      );
      return c.json({ status: 'refund_processed' });
    } catch (error) {
      console.error(`Webhook payment.refunded: error for order ${orderId}`, error);
      return webhookError(c, 'WEBHOOK_PROCESSING_FAILED', 'Failed to process refund', 500);
    }
  }

  // Unhandled event — acknowledge to prevent Razorpay retry spam.
  return c.json({ status: 'ignored', event });
});

function formatPurchaseDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default webhooks;
