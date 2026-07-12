import { describe, it, expect, beforeEach, beforeAll, mock } from 'bun:test';
import crypto from 'crypto';
import { resetSettingsCache } from '../src/admin/settings/service.js';

const keySecret = process.env.RAZORPAY_KEY_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxx';

// Mock razorpay.service.ts (local ESM module) instead of the CJS npm package,
// which cannot be intercepted at import time via mock.module.
mock.module('../src/services/razorpay.service.js', () => ({
  generateReceipt: (slug: string) => `r_${slug.slice(0, 6)}_test1234`,
  createOrder: async (amount: number, currency: string, receipt: string) => ({
    id: 'order_mock_123',
    entity: 'order',
    amount,
    amount_paid: 0,
    amount_due: amount,
    currency,
    receipt,
    status: 'created',
  }),
  verifyPaymentSignature: (
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean => {
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  },
  computePaymentSignature: (orderId: string, paymentId: string): string => {
    return crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  },
  getPublicKey: () => 'rzp_test_xxxxxxxxxxxx',
  verifyWebhookSignature: () => true,
}));

let app: any;
let mockDb: any;
let FIXTURES: any;

beforeAll(async () => {
  const h = await import('./helpers.ts');
  mockDb = h.mockDb;
  FIXTURES = h.FIXTURES;
  const mod = await import('../src/index.ts');
  app = mod.app;
});

describe('Payments API Route', () => {
  beforeEach(() => {
    mockDb.reset();
    resetSettingsCache();
  });

  describe('POST /api/payments/create-order', () => {
    it('creates a Razorpay order successfully', async () => {
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

    it('blocks new orders when Maintenance Mode is enabled', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('FROM settings')) {
          return Promise.resolve({
            rows: [
              {
                id: 's-1',
                key: 'payments',
                value: { maintenanceMode: true, taxEnabled: false },
                updated_at: new Date(),
                updated_by: null,
              },
            ],
            rowCount: 1,
          });
        }
        if (text.includes('products')) {
          return Promise.resolve({ rows: [FIXTURES.product], rowCount: 1 });
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

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toBe('MAINTENANCE_MODE');
    });

    it('includes tax breakdown in the order response when Tax Enabled', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('FROM settings')) {
          return Promise.resolve({
            rows: [
              {
                id: 's-1',
                key: 'payments',
                value: { maintenanceMode: false, taxEnabled: true },
                updated_at: new Date(),
                updated_by: null,
              },
            ],
            rowCount: 1,
          });
        }
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
      // base 2900 + 18% GST (522) = 3422
      expect(data.amount).toBe(3422);
      expect(data.tax).toBeDefined();
      expect(data.tax.taxEnabled).toBe(true);
      expect(data.tax.baseAmount).toBe(2900);
      expect(data.tax.taxAmount).toBe(522);
      expect(data.tax.totalAmount).toBe(3422);
    });

    it('rejects order for non-existent or inactive products', async () => {
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
    it('verifies a payment and completes the purchase successfully', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.purchase], rowCount: 1 });
        }
        if (text.includes('UPDATE purchases')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        if (text.includes('INSERT INTO entitlements')) {
          return Promise.resolve({ rows: [{ id: 'ent_123' }], rowCount: 1 });
        }
        if (text.includes('download_tokens WHERE purchase_id')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (text.includes('INSERT INTO download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const sig = crypto
        .createHmac('sha256', keySecret)
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
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('handles idempotent verification (re-verification returns existing token)', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        if (text.includes('download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const sig = crypto
        .createHmac('sha256', keySecret)
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
  });
});
