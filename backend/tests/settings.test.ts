import { describe, it, expect, beforeEach, beforeAll } from 'bun:test';
import { mock } from 'bun:test';

let mockDb: any;

beforeAll(async () => {
  const h = await import('./helpers.ts');
  mockDb = h.mockDb;
});

beforeEach(() => {
  mockDb.reset();
});

function mockSettingsRows(rows: Array<{ key: string; value: Record<string, unknown> }>) {
  mockDb.queryMock.mockImplementation((text: string) => {
    if (text.includes('FROM settings')) {
      return Promise.resolve({ rows, rowCount: rows.length });
    }
    if (text.includes('INSERT INTO settings')) {
      const key = text.includes('RETURNING') ? rows[0]?.key ?? 'payments' : 'payments';
      return Promise.resolve({ rows: [{ id: 'id-1', key, value: {}, updated_at: new Date(), updated_by: 'u-1' }], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
}

describe('Settings validation', () => {
  it('rejects an invalid accepted currency', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    expect(() => parseGroup('payments', { acceptedCurrency: 'XY' })).toThrow();
  });

  it('rejects an invalid receipt prefix', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    expect(() => parseGroup('payments', { receiptPrefix: '' })).toThrow();
  });

  it('coerces boolean defaults', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    const parsed = parseGroup('notifications', {});
    expect(parsed.adminEmailAlerts).toBe(true);
  });
});

describe('Settings service', () => {
  it('returns defaults when no rows exist', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    const all = await svc.getAllSettings();
    expect(all.payments.enablePayments).toBe(true);
    expect(all.notifications.adminEmailAlerts).toBe(true);
  });

  it('merges stored values over defaults', async () => {
    mockSettingsRows([{ key: 'payments', value: { enablePayments: false } }]);
    const svc = await import('../src/admin/settings/service.ts');
    const payments = await svc.getSettings('payments');
    expect(payments.enablePayments).toBe(false);
    expect(payments.acceptedCurrency).toBe('INR');
  });

  it('persists and audits an update', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    const updated = await svc.updateSettings(
      'payments',
      { enablePayments: false, maintenanceMode: true, acceptedCurrency: 'USD', taxEnabled: true, receiptPrefix: 'R-' },
      'admin-user-1',
      '127.0.0.1',
      'agent',
    );
    expect(updated.enablePayments).toBe(false);

    const auditInsert = mockDb.queries.find(
      (q: any) => q.text.includes('INSERT INTO audit_logs') && q.params?.[1] === 'payments_updated',
    );
    expect(auditInsert).toBeDefined();

    const settingsUpsert = mockDb.queries.find((q: any) => q.text.includes('INSERT INTO settings'));
    expect(settingsUpsert).toBeDefined();
  });

  it('rejects invalid update payloads', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    await expect(
      svc.updateSettings('payments', { acceptedCurrency: 'X' }, 'admin-user-1'),
    ).rejects.toThrow();
  });
});
