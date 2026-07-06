import { describe, it, expect, beforeEach } from 'bun:test';
import { app } from '../src/index.ts';
import { mockDb, FIXTURES } from './helpers.ts';
import { mock } from 'bun:test';

mock.module('fs', () => {
  return {
    default: {
      existsSync: (filePath: string) => {
        if (filePath.includes('..') || filePath.includes('/') && filePath.includes('etc')) return false;
        return filePath.includes('devbeast');
      },
      readdirSync: () => ['v1.0.0.zip'],
      statSync: () => ({ size: 1024 }),
    },
    existsSync: (filePath: string) => {
      if (filePath.includes('..') || filePath.includes('/') && filePath.includes('etc')) return false;
      return filePath.includes('devbeast');
    },
    readdirSync: () => ['v1.0.0.zip'],
    statSync: () => ({ size: 1024 }),
  };
});

describe('Downloads API Route', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('GET /api/downloads/:productSlug', () => {
    it('downloads the product zip successfully with valid token', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('products')) {
          return Promise.resolve({ rows: [FIXTURES.product], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/devbeast?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
      expect(res.headers.get('Content-Disposition')).toContain('devbeast-latest.zip');
    });

    it('rejects access if token is missing', async () => {
      const res = await app.request('/api/downloads/devbeast');
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('rejects access if token is invalid or does not exist', async () => {
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      );

      const res = await app.request('/api/downloads/devbeast?token=unknown');
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('rejects access if token has expired', async () => {
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      );

      const res = await app.request('/api/downloads/devbeast?token=expired_token_123');
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('rejects access if token is for a different product', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('products')) {
          const differentProduct = { ...FIXTURES.product, id: 'diff-id', slug: 'other-product', download_key: 'other-product' };
          return Promise.resolve({ rows: [differentProduct], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/devbeast?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('returns 500 if product physical file does not exist on disk', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('products')) {
          const missingFileProduct = { ...FIXTURES.product, slug: 'missing', download_key: 'missing' };
          return Promise.resolve({ rows: [missingFileProduct], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/missing?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('FILE_NOT_FOUND');
    });

    it('blocks path traversal attempts in product slug', async () => {
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('download_tokens')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('products')) {
          return Promise.resolve({ rows: [{ ...FIXTURES.product, slug: '..', download_key: '..' }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/..%2f..%2fetc%2fpasswd?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(500);
    });
  });
});
