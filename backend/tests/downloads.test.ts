import { describe, it, expect, beforeEach } from 'bun:test';
import app from '../src/index.ts';
import { mockDb, FIXTURES } from './helpers.ts';
import { mock } from 'bun:test';

// Mock the file system calls inside the downloads route
mock.module('fs', () => {
  return {
    default: {
      existsSync: (filePath: string) => {
        // Only return true for valid devbeast path, reject paths containing path traversals
        if (filePath.includes('..') || filePath.includes('/') && filePath.includes('etc')) return false;
        return filePath.includes('devbeast');
      },
      createReadStream: () => {
        const { Readable } = require('stream');
        return Readable.from(['mock zip file data']);
      },
    },
    existsSync: (filePath: string) => {
      if (filePath.includes('..') || filePath.includes('/') && filePath.includes('etc')) return false;
      return filePath.includes('devbeast');
    },
  };
});

describe('Downloads API Route', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('GET /api/downloads/:productSlug', () => {
    it('downloads the product zip successfully with valid token', async () => {
      // Mock DB: Get token -> returns valid token, Get product -> returns product
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM download_tokens WHERE token')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('SELECT * FROM products WHERE id')) {
          return Promise.resolve({ rows: [FIXTURES.product], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/devbeast?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/zip');
      expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="devbeast.zip"');
      
      const bodyText = await res.text();
      expect(bodyText).toBe('mock zip file data');
    });

    it('rejects access if token is missing', async () => {
      const res = await app.request('/api/downloads/devbeast');
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('VALIDATION_ERROR');
    });

    it('rejects access if token is invalid or does not exist', async () => {
      // Mock DB: Token not found
      mockDb.queryMock.mockImplementation(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      );

      const res = await app.request('/api/downloads/devbeast?token=unknown');
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('rejects access if token has expired', async () => {
      const expiredToken = {
        ...FIXTURES.downloadToken,
        expires_at: new Date(Date.now() - 1000), // expired 1s ago
      };

      // Mock DB: Get token returns expired token
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM download_tokens WHERE token')) {
          return Promise.resolve({ rows: [expiredToken], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/devbeast?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.error).toBe('TOKEN_EXPIRED');
    });

    it('rejects access if token is for a different product', async () => {
      // Mock DB: Get token -> returns valid token, Get product -> returns DIFFERENT product slug/id
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM download_tokens WHERE token')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('SELECT * FROM products WHERE id')) {
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

    it('returns 404 if product physical file does not exist on disk', async () => {
      // Mock DB: Get token -> returns valid token, Get product -> returns product with missing file key
      mockDb.queryMock.mockImplementation((text: string) => {
        if (text.includes('SELECT * FROM download_tokens WHERE token')) {
          return Promise.resolve({ rows: [FIXTURES.downloadToken], rowCount: 1 });
        }
        if (text.includes('SELECT * FROM products WHERE id')) {
          const missingFileProduct = { ...FIXTURES.product, slug: 'missing', download_key: 'missing' };
          return Promise.resolve({ rows: [missingFileProduct], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const res = await app.request('/api/downloads/missing?token=token_mock_1234567890abcdef');
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe('FILE_NOT_FOUND');
    });

    it('blocks path traversal attempts in product slug', async () => {
      const res = await app.request('/api/downloads/..%2f..%2fetc%2fpasswd?token=token_mock_1234567890abcdef');
      // Should either be rejected by route matching or file exists validation
      expect(res.status).toBe(404);
    });
  });
});
