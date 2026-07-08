/**
 * Payment Routes
 *
 * POST /api/payments/create-order — Create a Razorpay order for a product purchase
 * POST /api/payments/verify       — Verify payment signature and complete purchase
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import * as productService from '../services/product.service.js';
import * as razorpayService from '../services/razorpay.service.js';
import * as purchaseService from '../services/purchase.service.js';
import { emailService } from '../email/index.js';
import { config } from '../config.js';
import { validateEmail } from '../communication/shared/validators.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { CreateOrderRequest, VerifyPaymentRequest } from '../types/index.js';

function payError(c: Context, error: string, message: string, status: ContentfulStatusCode) {
  return c.json({ error, message, requestId: (c as any).get('requestId') as string | undefined }, status);
}

const payments = new Hono();

/**
 * Create a Razorpay order for a product purchase.
 *
 * Flow:
 * 1. Normalise email
 * 2. Validate product exists and is active (via ProductService)
 * 3. Check: does the customer already own this product?  If so, reject early.
 * 4. Get authoritative price from database (never trust frontend)
 * 5. Create Razorpay order with a safe receipt ID (≤40 chars)
 * 6. Record purchase in database with normalised guest_email
 * 7. Return order details + public key to frontend
 */
payments.post('/create-order', async (c) => {
  let body: CreateOrderRequest | undefined;
  try {
    body = await c.req.json<CreateOrderRequest>();
  } catch {
    return payError(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }
  const { productSlug, email: rawEmail } = body!;

  if (!productSlug || !rawEmail) {
    return payError(c, 'VALIDATION_ERROR', 'productSlug and email are required', 400);
  }

  const email = purchaseService.normaliseEmail(rawEmail);

  if (!validateEmail(email)) {
    return payError(c, 'VALIDATION_ERROR', 'Invalid email address', 400);
  }

  const { valid, product, reason } = await productService.validateProduct(productSlug);
  if (!valid || !product) {
    return payError(c, 'INVALID_PRODUCT', reason || 'Product not available', 400);
  }

  // Determine if this is a logged-in user purchasing for themselves.
  const authUser = c.get('user');
  const isLoggedInUser = authUser !== null && authUser.email.toLowerCase() === email.toLowerCase();
  const currentUserId = isLoggedInUser ? authUser.id : undefined;

  // Guard: prevent duplicate purchases.
  // Checks both user_id and guest_email paths.
  const alreadyOwns = await purchaseService.hasEntitlement(email, product.id, currentUserId);
  if (alreadyOwns) {
    return payError(c, 'ALREADY_PURCHASED', 'You already own this product. Download it from your confirmation email.', 409);
  }

  try {
    // Create Razorpay order with a safe receipt ID (guaranteed ≤40 chars).
    const receipt = razorpayService.generateReceipt(product.slug);
    const order = await razorpayService.createOrder(
      product.price,
      product.currency,
      receipt
    );

    // Record purchase attempt.
    // For logged-in users: store user_id + guest_email (audit).
    // For guests: store only guest_email.
    // createPurchase returns null if a concurrent request already created a purchase
    // for this identity + product (atomic WHERE NOT EXISTS guard).
    const purchase = await purchaseService.createPurchase(
      email,
      product.id,
      order.id,
      product.price,
      product.currency,
      currentUserId
    );

    if (!purchase) {
      console.warn(`Duplicate purchase attempt blocked: email=${email} product=${productSlug}`);
      return payError(c, 'ALREADY_PURCHASED', 'A recent purchase is already in progress for this email and product. If you abandoned a previous checkout, please wait 30 minutes and try again.', 409);
    }

    return c.json({
      orderId: order.id,
      amount: product.price,
      currency: product.currency,
      key: razorpayService.getPublicKey(),
      productName: product.name,
    });
  } catch (error) {
    console.error('Failed to create order:', error);
    return payError(c, 'ORDER_CREATION_FAILED', 'Failed to create payment order. Please try again.', 500);
  }
});

/**
 * Verify a Razorpay payment and complete the purchase.
 *
 * Flow:
 * 1. Verify the HMAC signature (proves payment is genuine)
 * 2. Verify the order exists in our database
 * 3. Atomically update purchase to 'paid' AND grant entitlement
 * 4. Issue a secure download token
 * 5. Return success + downloadToken to frontend
 */
payments.post('/verify', async (c) => {
  let body: VerifyPaymentRequest | undefined;
  try {
    body = await c.req.json<VerifyPaymentRequest>();
  } catch {
    return payError(c, 'BAD_REQUEST', 'Invalid JSON in request body', 400);
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body!;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return payError(c, 'VALIDATION_ERROR', 'Missing required payment verification fields', 400);
  }

  const isValid = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    console.error('Payment signature verification failed for order:', razorpay_order_id);
    emailService.sendAdminNotification({
      subject: 'Payment verification failed',
      message: `Payment signature verification failed for order ${razorpay_order_id}. Possible tampering.`,
      metadata: { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
    }).catch((err) => console.error('[payment] sendAdminNotification failed:', err));
    return payError(c, 'VERIFICATION_FAILED', 'Payment verification failed. Contact support if payment was deducted.', 400);
  }

  const purchase = await purchaseService.getPurchaseByOrderId(razorpay_order_id);
  if (!purchase) {
    return payError(c, 'ORDER_NOT_FOUND', 'No matching order found for this payment', 400);
  }

  try {
    // Atomically complete purchase + grant entitlement in one transaction.
    const updatedPurchase = await purchaseService.completePurchaseAndGrantEntitlement(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!updatedPurchase) {
      return payError(c, 'COMPLETION_FAILED', 'Failed to complete purchase', 500);
    }

    // Issue a download token. Look for an existing active token first
    // (idempotent re-verification), otherwise generate a fresh one.
    let downloadTokenRecord;
    const existingToken = await purchaseService.validateActiveTokenByPurchase(
      updatedPurchase.id
    );
    if (existingToken) {
      downloadTokenRecord = existingToken;
    } else {
      downloadTokenRecord = await purchaseService.generateDownloadToken(
        updatedPurchase.id,
        updatedPurchase.product_id
      );
    }

    console.info(
      `Payment verified: purchase=${updatedPurchase.id} order=${razorpay_order_id} payment=${razorpay_payment_id}`
    );

    // Fire-and-forget purchase receipt + download emails.
    const buyerEmail = updatedPurchase.guest_email;
    if (buyerEmail) {
      productService.getProductById(updatedPurchase.product_id).then((product) => {
        const productSlug = product?.slug;
        const productName = product?.name ?? 'Product';
        const accountUrl = `${config.frontendUrl}/account`;

        emailService.sendPurchaseReceipt({
          email: buyerEmail,
          productName,
          amount: updatedPurchase.amount,
          currency: updatedPurchase.currency,
          razorpayPaymentId: updatedPurchase.razorpay_payment_id ?? '',
          razorpayOrderId: updatedPurchase.razorpay_order_id,
          purchaseDate: formatPurchaseDate(updatedPurchase.updated_at ?? updatedPurchase.created_at),
          accountUrl,
        }).catch((err) => {
          console.error('[payment] sendPurchaseReceipt failed:', err);
          emailService.sendAdminNotification({
            subject: 'Email send failure — purchase receipt',
            message: `Failed to send purchase receipt email to ${buyerEmail}.`,
            metadata: { email: buyerEmail, error: String(err), orderId: updatedPurchase.razorpay_order_id },
          }).catch((adminErr) => console.error('[payment] sendAdminNotification (receipt failure) failed:', adminErr));
        });

        if (productSlug) {
          emailService.sendDownloadEmail({
            email: buyerEmail,
            productName,
            downloadUrl: `${config.auth.url}/api/downloads/${productSlug}?token=${downloadTokenRecord.token}`,
            expiresAt: formatPurchaseDate(downloadTokenRecord.expires_at),
            accountUrl,
          }).catch((err) => {
            console.error('[payment] sendDownloadEmail failed:', err);
            emailService.sendAdminNotification({
              subject: 'Email send failure — download email',
              message: `Failed to send download email to ${buyerEmail}.`,
              metadata: { email: buyerEmail, error: String(err), orderId: updatedPurchase.razorpay_order_id },
            }).catch((adminErr) => console.error('[payment] sendAdminNotification (download failure) failed:', adminErr));
          });
        }
      }).catch((err) => console.error('[payment] getProductById failed:', err));
    }

    return c.json({
      success: true,
      message: 'Payment verified and purchase completed successfully',
      downloadToken: downloadTokenRecord.token,
      downloadTokenExpiresAt: downloadTokenRecord.expires_at,
      downloadTokenTtlSeconds: config.downloadTokenTtlSeconds,
    });
  } catch (error) {
    console.error('Failed to complete purchase for order:', razorpay_order_id, error);
    return payError(c, 'COMPLETION_FAILED', 'Failed to complete purchase. Please contact support.', 500);
  }
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

export default payments;
