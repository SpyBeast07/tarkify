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
import type { CreateOrderRequest, VerifyPaymentRequest } from '../types/index.js';

const payments = new Hono();

/**
 * Create a Razorpay order for a product purchase.
 *
 * Flow:
 * 1. Validate product exists and is active (via ProductService)
 * 2. Get authoritative price from database (never trust frontend)
 * 3. Create Razorpay order
 * 4. Record purchase in database with guest_email
 * 5. Return order details + public key to frontend
 */
payments.post('/create-order', async (c) => {
  const body = await c.req.json<CreateOrderRequest>();
  const { productSlug, email } = body;

  // Validate required fields
  if (!productSlug || !email) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'productSlug and email are required' },
      400
    );
  }

  // Validate email format
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

  try {
    // Create Razorpay order with the authoritative price from DB
    const receipt = `receipt_${product.slug}_${Date.now()}`;
    const order = await razorpayService.createOrder(
      product.price,
      product.currency,
      receipt
    );

    // Record purchase attempt with guest_email (user_id is null for guests)
    await purchaseService.createPurchase(
      email,
      product.id,
      order.id,
      product.price,
      product.currency
    );

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
 * 3. Update purchase status to 'paid'
 * 4. Grant product entitlement to guest_email
 */
payments.post('/verify', async (c) => {
  const body = await c.req.json<VerifyPaymentRequest>();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return c.json(
      { error: 'VALIDATION_ERROR', message: 'Missing required payment verification fields' },
      400
    );
  }

  // Verify signature — this proves the payment came from Razorpay
  const isValid = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    console.error('Payment signature verification failed:', { razorpay_order_id });
    return c.json(
      { error: 'VERIFICATION_FAILED', message: 'Payment verification failed. Contact support if payment was deducted.' },
      400
    );
  }

  // Find the purchase record
  const purchase = await purchaseService.getPurchaseByOrderId(razorpay_order_id);
  if (!purchase) {
    return c.json(
      { error: 'ORDER_NOT_FOUND', message: 'No matching order found for this payment' },
      400
    );
  }

  // Complete the purchase (idempotent — safe for duplicate calls)
  const updatedPurchase = await purchaseService.completePurchase(
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

  // Grant product ownership via guest_email (idempotent via ON CONFLICT)
  if (purchase.guest_email) {
    await purchaseService.grantEntitlement(
      purchase.guest_email,
      purchase.product_id,
      purchase.id
    );
  }

  return c.json({
    success: true,
    message: 'Payment verified and purchase completed successfully',
  });
});

export default payments;
