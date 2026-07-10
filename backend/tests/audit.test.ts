import { describe, it, expect, beforeEach, beforeAll } from 'bun:test';

let mockDb: any;

beforeAll(async () => {
  const h = await import('./helpers.ts');
  mockDb = h.mockDb;
});

beforeEach(() => {
  mockDb.reset();
});

function mockAuditRows(rows: any[], count = rows.length) {
  mockDb.queryMock.mockImplementation((text: string) => {
    if (text.trim().startsWith('SELECT COUNT')) {
      return Promise.resolve({ rows: [{ count }], rowCount: 1 });
    }
    if (text.includes('FROM audit_logs')) {
      return Promise.resolve({ rows, rowCount: rows.length });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
}

const sampleRow = {
  id: 'a1',
  event: 'product_created',
  module: 'Products',
  status: 'success',
  metadata: { product_id: 'p1', name: 'DevBeast' },
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  created_at: new Date('2024-01-02T10:00:00Z'),
  user_id: 'u1',
  actor_email: 'admin@test.tarkify',
  actor_name: 'Admin'
};

describe('Audit repository mapping', () => {
  it('derives module from event', async () => {
    const repo = await import('../src/admin/audit/repository.ts');
    const { MODULE_EXPR } = repo;
    expect(MODULE_EXPR).toContain('Products');
  });

  it('sanitizes sensitive metadata keys', async () => {
    const repo = await import('../src/admin/audit/repository.ts');
    const out = repo.sanitizeMetadata({ password: 'hunter2', note: 'ok' });
    expect(out.password).toBe('***REDACTED***');
    expect(out.note).toBe('ok');
  });

  it('derives device from user agent', async () => {
    const repo = await import('../src/admin/audit/repository.ts');
    const device = repo.deriveDevice(sampleRow.user_agent);
    expect(device).toContain('Chrome');
    expect(device).toContain('macOS');
  });
});

describe('Audit service', () => {
  it('lists audit logs with pagination metadata', async () => {
    mockAuditRows([sampleRow], 25);
    const svc = await import('../src/admin/audit/service.ts');
    const res = await svc.listAuditLogs({ page: 1, perPage: 20 });
    expect(res.events.length).toBe(1);
    expect(res.total).toBe(25);
    expect(res.totalPages).toBe(2);
    expect(res.events[0].module).toBe('Products');
    expect(res.events[0].actor?.email).toBe('admin@test.tarkify');
    expect(res.events[0].device).toContain('Chrome');
  });

  it('returns null for missing detail', async () => {
    mockAuditRows([]);
    const svc = await import('../src/admin/audit/service.ts');
    const detail = await svc.getAuditById('missing');
    expect(detail).toBeNull();
  });

  it('builds related entity list for detail', async () => {
    mockAuditRows([sampleRow]);
    const svc = await import('../src/admin/audit/service.ts');
    const detail = await svc.getAuditById('a1');
    expect(detail?.relatedEntity.some((r) => r.key === 'product_id')).toBe(true);
  });

  it('computes stats', async () => {
    mockDb.queryMock.mockImplementation((text: string) => {
      if (text.includes('COUNT')) {
        return Promise.resolve({
          rows: [{ total: 100, today: 5, failed: 2, successful: 98, unique_admins: 3 }],
          rowCount: 1
        });
      }
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
    const svc = await import('../src/admin/audit/service.ts');
    const stats = await svc.getStats();
    expect(stats.total).toBe(100);
    expect(stats.uniqueAdmins).toBe(3);
  });
});
