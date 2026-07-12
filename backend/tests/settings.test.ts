import { describe, it, expect, beforeEach, beforeAll } from 'bun:test';
import { mock } from 'bun:test';
import { resetSettingsCache } from '../src/admin/settings/service.ts';

let mockDb: any;

beforeAll(async () => {
  const h = await import('./helpers.ts');
  mockDb = h.mockDb;
});

beforeEach(() => {
  mockDb.reset();
  resetSettingsCache();
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
  it('coerces boolean defaults', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    const parsed = parseGroup('notifications', {});
    expect(parsed.adminEmailAlerts).toBe(true);
  });

  it('coerces payments defaults', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    const parsed = parseGroup('payments', {});
    expect(parsed.maintenanceMode).toBe(false);
    expect(parsed.taxEnabled).toBe(false);
  });
});

describe('Settings service', () => {
  it('returns defaults when no rows exist', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    const all = await svc.getAllSettings();
    expect(all.payments.maintenanceMode).toBe(false);
    expect(all.notifications.adminEmailAlerts).toBe(true);
  });

  it('merges stored values over defaults', async () => {
    mockSettingsRows([{ key: 'payments', value: { maintenanceMode: true } }]);
    const svc = await import('../src/admin/settings/service.ts');
    const payments = await svc.getSettings('payments');
    expect(payments.maintenanceMode).toBe(true);
    expect(payments.taxEnabled).toBe(false);
  });

  it('persists and audits an update', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    const updated = await svc.updateSettings(
      'payments',
      { maintenanceMode: true, taxEnabled: true },
      'admin-user-1',
      '127.0.0.1',
      'agent',
    );
    expect(updated.maintenanceMode).toBe(true);
    expect(updated.taxEnabled).toBe(true);

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
      svc.updateSettings('payments', { maintenanceMode: 'not-a-bool' }, 'admin-user-1'),
    ).rejects.toThrow();
  });
});
