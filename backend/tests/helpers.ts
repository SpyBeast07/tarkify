import { mock } from 'bun:test';

// Central store for database query logs and mock implementations
export const mockDb = {
  queryCount: 0,
  queries: [] as { text: string; params?: any[] }[],
  queryMock: mock(() => Promise.resolve({ rows: [] as any[], rowCount: 0, rowsAffected: 0 })),
  connectMock: mock(() =>
    Promise.resolve({
      query: mock((text: string, params?: any[]) => {
        mockDb.queries.push({ text, params });
        mockDb.queryCount++;
        return Promise.resolve({ rows: [] as any[], rowCount: 0 });
      }),
      release: mock(() => {}),
    })
  ),
  reset() {
    this.queryCount = 0;
    this.queries = [];
    this.queryMock.mockClear();
    this.queryMock.mockImplementation(() => Promise.resolve({ rows: [], rowCount: 0 }));
    this.connectMock.mockClear();
  },
};

// Intercept PostgreSQL driver calls at import time
mock.module('../src/db.ts', () => {
  return {
    query: async (text: string, params?: any[]) => {
      mockDb.queries.push({ text, params });
      mockDb.queryCount++;
      return mockDb.queryMock(text, params);
    },
    withTransaction: async (fn: (client: any) => Promise<any>) => {
      const client = {
        query: mock(async (text: string, params?: any[]) => {
          mockDb.queries.push({ text, params });
          mockDb.queryCount++;
          if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
            return { rows: [], rowCount: 0 };
          }
          return mockDb.queryMock(text, params);
        }),
        release: mock(() => {}),
      };
      try {
        const result = await fn(client);
        return result;
      } catch (err) {
        // Mock error rollback flow
        await client.query('ROLLBACK');
        throw err;
      }
    },
    pool: {
      connect: () => mockDb.connectMock(),
      query: (text: string, params?: any[]) => mockDb.queryMock(text, params),
      on: () => {},
      end: () => Promise.resolve(),
    },
    testConnection: async () => {},
  };
});

// Intercept Razorpay SDK requests
export const mockRazorpayInstance = {
  orders: {
    create: mock(() =>
      Promise.resolve({
        id: 'order_mock_123',
        amount: 2900,
        currency: 'INR',
        receipt: 'r_devbea_123',
      })
    ),
  },
  reset() {
    this.orders.create.mockClear();
    this.orders.create.mockImplementation(() =>
      Promise.resolve({
        id: 'order_mock_123',
        amount: 2900,
        currency: 'INR',
        receipt: 'r_devbea_123',
      })
    ),
  }
};

mock.module('razorpay', () => {
  return {
    default: class MockRazorpay {
      orders = mockRazorpayInstance.orders;
    },
  };
});

// Common test fixtures
export const FIXTURES = {
  product: {
    id: 'b8d96bbf-349f-4318-ae71-12c85e2db812',
    slug: 'devbeast',
    name: 'DevBeast',
    description: 'DevOps Control Plane',
    type: 'ONE_TIME',
    price: 2900,
    currency: 'INR',
    download_key: 'devbeast',
    active: true,
  },
  purchase: {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    guest_email: 'user@example.com',
    product_id: 'b8d96bbf-349f-4318-ae71-12c85e2db812',
    razorpay_order_id: 'order_mock_123',
    razorpay_payment_id: null,
    razorpay_signature: null,
    amount: 2900,
    currency: 'INR',
    status: 'created',
    created_at: new Date(),
    updated_at: new Date(),
  },
  paidPurchase: {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    guest_email: 'user@example.com',
    product_id: 'b8d96bbf-349f-4318-ae71-12c85e2db812',
    razorpay_order_id: 'order_mock_123',
    razorpay_payment_id: 'pay_mock_123',
    razorpay_signature: 'sig_mock_123',
    amount: 2900,
    currency: 'INR',
    status: 'paid',
    created_at: new Date(),
    updated_at: new Date(),
  },
  downloadToken: {
    token: 'token_mock_1234567890abcdef',
    purchase_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    product_id: 'b8d96bbf-349f-4318-ae71-12c85e2db812',
    expires_at: new Date(Date.now() + 600 * 1000), // +10m
    created_at: new Date(),
  },
};
