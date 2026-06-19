/**
 * Payment Routes
 *
 * POST /api/payments/create-order — Create a Razorpay order for a product purchase
 * POST /api/payments/verify       — Verify payment signature and complete purchase
 */

import { Hono } from 'hono';
import * as productService from '../services/product.service.js';
import * as razorpayService from '../services/razorpay.service.js';
import * as purchaseService from '../services/purchase.service.js';
import { config } from '../config.js';
import type { CreateOrderRequest, VerifyPaymentRequest } from '../types/index.js';

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
    return c.json(
      { error: 'BAD_REQUEST', message: 'Invalid JSON in request body' },
      400
    );
  }
  const { productSlug, email: rawEmail } = body!;

  // Validate required fields
  if (!productSlug || !rawEmail) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'productSlug and email are required' },
      400
    );
  }

  // Normalise email before any use
  const email = purchaseService.normaliseEmail(rawEmail);

  // Validate email format (after normalisation)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid email address' },
      400
    );
  }

  // Validate product through ProductService
  const { valid, product, reason } = await productService.validateProduct(productSlug);
  if (!valid || !product) {
    return c.json(
      { error: 'INVALID_PRODUCT', message: reason || 'Product not available' },
      400
    );
  }

  // Guard: prevent duplicate purchases.
  // If this email already holds an active entitlement for this product, do
  // not create another Razorpay order — return a clear error instead.
  const alreadyOwns = await purchaseService.hasEntitlement(email, product.id);
  if (alreadyOwns) {
    return c.json(
      {
        error: 'ALREADY_PURCHASED',
        message: 'You already own this product. Download it from your confirmation email.',
      },
      409
    );
  }

  try {
    // Create Razorpay order with a safe receipt ID (guaranteed ≤40 chars).
    const receipt = razorpayService.generateReceipt(product.slug);
    const order = await razorpayService.createOrder(
      product.price,
      product.currency,
      receipt
    );

    // Record purchase attempt with normalised guest_email (user_id is null for guests).
    // createPurchase returns null if a concurrent request already created a purchase
    // for this email + product (atomic WHERE NOT EXISTS guard). In that case, we still
    // created a Razorpay order, but it will expire unpaid — that is harmless.
    const purchase = await purchaseService.createPurchase(
      email,
      product.id,
      order.id,
      product.price,
      product.currency
    );

    if (!purchase) {
      console.warn(`Duplicate purchase attempt blocked: email=${email} product=${productSlug}`);
      return c.json(
        {
          error: 'ALREADY_PURCHASED',
          message: 'A purchase is already in progress for this email and product.',
        },
        409
      );
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
    return c.json(
      { error: 'ORDER_CREATION_FAILED', message: 'Failed to create payment order. Please try again.' },
      500
    );
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
    return c.json(
      { error: 'BAD_REQUEST', message: 'Invalid JSON in request body' },
      400
    );
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body!;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'Missing required payment verification fields' },
      400
    );
  }

  // Verify signature — this proves the payment came from Razorpay.
  // verifyPaymentSignature now safely returns false on malformed input.
  const isValid = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    console.error('Payment signature verification failed for order:', razorpay_order_id);
    return c.json(
      { error: 'VERIFICATION_FAILED', message: 'Payment verification failed. Contact support if payment was deducted.' },
      400
    );
  }

  // Find the purchase record first to get product context.
  const purchase = await purchaseService.getPurchaseByOrderId(razorpay_order_id);
  if (!purchase) {
    return c.json(
      { error: 'ORDER_NOT_FOUND', message: 'No matching order found for this payment' },
      400
    );
  }

  try {
    // Atomically complete purchase + grant entitlement in one transaction.
    const updatedPurchase = await purchaseService.completePurchaseAndGrantEntitlement(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!updatedPurchase) {
      return c.json(
        { error: 'COMPLETION_FAILED', message: 'Failed to complete purchase' },
        500
      );
    }

    // If the purchase was already paid (idempotent case), do NOT generate
    // a second download token — the existing one from the first /verify
    // call remains valid.
    let downloadTokenRecord;
    if (updatedPurchase.status === 'paid' && updatedPurchase.razorpay_payment_id !== null) {
      // This was already completed — look up the existing token.
      const existingToken = await purchaseService.validateActiveTokenByPurchase(
        updatedPurchase.id
      );
      if (!existingToken) {
        return c.json(
          { error: 'COMPLETION_FAILED', message: 'No active token found for this purchase' },
          500
        );
      }
      downloadTokenRecord = existingToken;
    } else {
      // First-time completion — issue a fresh download token.
      downloadTokenRecord = await purchaseService.generateDownloadToken(
        updatedPurchase.id,
        updatedPurchase.product_id
      );
    }

    console.info(
      `Payment verified: purchase=${updatedPurchase.id} order=${razorpay_order_id} payment=${razorpay_payment_id}`
    );

    return c.json({
      success: true,
      message: 'Payment verified and purchase completed successfully',
      downloadToken: downloadTokenRecord.token,
      downloadTokenExpiresAt: downloadTokenRecord.expires_at,
      downloadTokenTtlSeconds: config.downloadTokenTtlSeconds,
    });
  } catch (error) {
    console.error('Failed to complete purchase for order:', razorpay_order_id, error);
    return c.json(
      { error: 'COMPLETION_FAILED', message: 'Failed to complete purchase. Please contact support.' },
      500
    );
  }
});

export default payments;
