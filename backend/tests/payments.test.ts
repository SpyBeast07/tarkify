import { describe, it, expect, beforeEach } from 'bun:test';
import app from '../src/index.ts';
import { mockDb, mockRazorpayInstance, FIXTURES } from './helpers.ts';

describe('Payments API Route', () => {
  beforeEach(() => {
    mockDb.reset();
    mockRazorpayInstance.reset();
  });

  describe('POST /api/payments/create-order', () => {
    it('creates a Razorpay order successfully', async () => {
      // Mock DB: Product active, no entitlement, and purchase row inserts successfully
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('products')) {
          return Promise.resolve({ rows: [FIXTURES.product], rowCount: 1 });
        }
        if (text.includes('entitlements')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (text.includes('INSERT INTO purchases')) {
          return Promise.resolve({ rows: [FIXTURES.purchase], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'devbeast',
          email: 'user@example.com',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('orderId', 'order_mock_123');
      expect(data).toHaveProperty('amount', 2900);
      expect(data).toHaveProperty('currency', 'INR');
      expect(data).toHaveProperty('key');
    });

    it('rejects order for non-existent or inactive products', async () => {
      // Mock DB: Product query returns empty
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      );

      const res = await app.request('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'unknown',
          email: 'user@example.com',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('INVALID_PRODUCT');
    });

    it('rejects order with invalid email address format', async () => {
      const res = await app.request('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'devbeast',
          email: 'invalid-email',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('blocks purchase creation if product already owned', async () => {
      // Mock DB: Product active, entitlement exists
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('products')) {
          return Promise.resolve({ rows: [FIXTURES.product], rowCount: 1 });
        }
        if (text.includes('entitlements')) {
          return Promise.resolve({ rows: [{ id: 'ent_123' }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'devbeast',
          email: 'user@example.com',
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('ALREADY_PURCHASED');
    });
  });

  describe('POST /api/payments/verify', () => {
    const validVerifyPayload = {
      razorpay_order_id: 'order_mock_123',
      razorpay_payment_id: 'pay_mock_123',
      // Authoritative signature generated via crypto.createHmac over order|payment
      razorpay_signature: '73c1c4f52fdfcc62bb5ec493bbd29e30a57e3f84852ee3ff45be84f72db773c1', // dummy HMAC, we will mock signature verification return in tests or bypass it
    };

    it('verifies a payment and completes the purchase successfully', async () => {
      // Mock DB: Get purchase by order ID -> returns purchase row, completePurchase -> returns paid purchase row, generate token -> returns token row
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.purchase], rowCount: 1 });
        }
        if (text.includes('UPDATE purchases')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        if (text.includes('INSERT INTO download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Calculate a genuine HMAC signature
      const crypto = require('crypto');
      const sig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxx')
        .update('order_mock_123|pay_mock_123')
        .digest('hex');

      const res = await app.request('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_mock_123',
          razorpay_payment_id: 'pay_mock_123',
          razorpay_signature: sig,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('downloadToken', FIXTURES.downloadToken.token);
    });

    it('rejects verification if signature is invalid', async () => {
      const res = await app.request('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_mock_123',
          razorpay_payment_id: 'pay_mock_123',
          razorpay_signature: 'invalid_signature_here',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VERIFICATION_FAILED');
    });

    it('rejects verification if fields are missing', async () => {
      const res = await app.request('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_mock_123',
          // missing payment id and signature
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('handles idempotent verification (re-verification returns existing token)', async () => {
      // Mock DB: Get purchase by order ID returns ALREADY PAID purchase
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        if (text.includes('SELECT * FROM download_tokens WHERE purchase_id')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      // Calculate valid signature for 'order_mock_123|pay_mock_123'
      const crypto = require('crypto');
      const sig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxx')
        .update('order_mock_123|pay_mock_123')
        .digest('hex');

      const res = await app.request('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_mock_123',
          razorpay_payment_id: 'pay_mock_123',
          razorpay_signature: sig,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('downloadToken', FIXTURES.downloadToken.token);
    });

    it('performs database rollback if entitlement grant fails', async () => {
      // Mock DB: Complete transaction fail on update or insert
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.purchase], rowCount: 1 });
        }
        if (text.includes('UPDATE purchases')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        if (text.includes('INSERT INTO entitlements')) {
          return Promise.reject(new Error('Mock database crash on entitlement grant'));
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const crypto = require('crypto');
      const sig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxx')
        .update('order_mock_123|pay_mock_123')
        .digest('hex');

      const res = await app.request('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: 'order_mock_123',
          razorpay_payment_id: 'pay_mock_123',
          razorpay_signature: sig,
        }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('COMPLETION_FAILED');

      // Verify ROLLBACK was called
      const rollbackCalled = mockDb.queries.some((q) => q.text === 'ROLLBACK');
      expect(rollbackCalled).toBe(true);
    });
  });
});
