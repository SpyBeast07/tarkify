import { describe, it, expect, beforeEach } from 'bun:test';
import app from '../src/index.ts';
import { mockDb, FIXTURES } from './helpers.ts';
import crypto from 'crypto';

describe('Webhooks API Route', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxx';

  function createSignedRequest(payload: any) {
    const bodyStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    return {
      body: bodyStr,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
    };
  }

  describe('POST /api/webhooks/razorpay', () => {
    it('processes a payment.captured webhook successfully', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_mock_123',
              order_id: 'order_mock_123',
              amount: 2900,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      // Mock DB: Get purchase -> returns created purchase, Complete purchase -> returns paid purchase, Generate token -> returns token row
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

      const reqOptions = createSignedRequest(payload);
      const res = await app.request('/api/webhooks/razorpay', {
        method: 'POST',
        headers: reqOptions.headers,
        body: reqOptions.body,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('status', 'purchase_completed');
    });

    it('rejects webhooks with an invalid signature', async () => {
      const payload = { event: 'payment.captured' };
      const res = await app.request('/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'wrong_signature_here',
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('INVALID_SIGNATURE');
    });

    it('handles duplicate webhook deliveries gracefully (idempotency)', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_mock_123',
              order_id: 'order_mock_123',
              amount: 2900,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      // Mock DB: Get purchase by order ID returns ALREADY PAID purchase
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const reqOptions = createSignedRequest(payload);
      const res = await app.request('/api/webhooks/razorpay', {
        method: 'POST',
        headers: reqOptions.headers,
        body: reqOptions.body,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('status', 'already_processed');
    });

    it('processes a payment.refunded webhook and revokes entitlements', async () => {
      const payload = {
        event: 'payment.refunded',
        payload: {
          payment: {
            entity: {
              id: 'pay_mock_123',
              order_id: 'order_mock_123',
              amount: 2900,
              currency: 'INR',
              status: 'refunded',
            },
          },
        },
      };

      // Mock DB: Get purchase -> returns paid purchase, update purchase status -> returns refunded purchase, update entitlements revoked_at -> returns revoked row
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM purchases WHERE razorpay_order_id')) {
          return Promise.resolve({ rows: [FIXTURES.paidPurchase], rowCount: 1 });
        }
        if (text.includes('UPDATE purchases SET status = $1')) {
          const refundedPurchase = { ...FIXTURES.paidPurchase, status: 'refunded' };
          return Promise.resolve({ rows: [refundedPurchase], rowCount: 1 });
        }
        if (text.includes('UPDATE entitlements SET revoked_at')) {
          return Promise.resolve({ rows: [{ id: 'ent_123', revoked_at: new Date() }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const reqOptions = createSignedRequest(payload);
      const res = await app.request('/api/webhooks/razorpay', {
        method: 'POST',
        headers: reqOptions.headers,
        body: reqOptions.body,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('status', 'purchase_refunded');
    });

    it('ignores unknown webhook events and returns 200', async () => {
      const payload = {
        event: 'order.paid', // Event not handled in code
      };

      const reqOptions = createSignedRequest(payload);
      const res = await app.request('/api/webhooks/razorpay', {
        method: 'POST',
        headers: reqOptions.headers,
        body: reqOptions.body,
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('status', 'event_ignored');
    });
  });
});
