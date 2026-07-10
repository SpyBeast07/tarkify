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
      const key = text.includes('RETURNING') ? rows[0]?.key ?? 'general' : 'general';
      return Promise.resolve({ rows: [{ id: 'id-1', key, value: {}, updated_at: new Date(), updated_by: 'u-1' }], rowCount: 1 });
    }
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
}

describe('Settings validation', () => {
  it('rejects an invalid hex color', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    expect(() => parseGroup('brand', { primaryColor: 'not-a-color' })).toThrow();
  });

  it('rejects an invalid email', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    expect(() => parseGroup('general', { supportEmail: 'nope' })).toThrow();
  });

  it('rejects an invalid url', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    expect(() => parseGroup('brand', { logoUrl: 'ftp://bad' })).toThrow();
  });

  it('accepts an empty optional url', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    const parsed = parseGroup('brand', {
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#7b904b',
      secondaryColor: '#6366f1',
      companyDescription: '',
      socialLinks: [],
    });
    expect(parsed.logoUrl).toBe('');
  });

  it('coerces boolean defaults', async () => {
    const { parseGroup } = await import('../src/admin/settings/validation.ts');
    const parsed = parseGroup('features', {});
    expect(parsed.downloads).toBe(true);
  });
});

describe('Settings service', () => {
  it('returns defaults when no rows exist', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    const all = await svc.getAllSettings();
    expect(all.general.applicationName).toBe('Tarkify');
    expect(all.brand.primaryColor).toBe('#7b904b');
    expect(all.features.analytics).toBe(true);
  });

  it('merges stored values over defaults', async () => {
    mockSettingsRows([{ key: 'general', value: { applicationName: 'CustomApp' } }]);
    const svc = await import('../src/admin/settings/service.ts');
    const general = await svc.getSettings('general');
    expect(general.applicationName).toBe('CustomApp');
    expect(general.companyName).toBe('Tarkify');
  });

  it('persists and audits an update', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    const updated = await svc.updateSettings(
      'general',
      { applicationName: 'NewName', companyName: 'NewCo', supportEmail: 'a@b.com', contactEmail: 'c@d.com', timezone: 'UTC', language: 'en', currency: 'INR', dateFormat: 'YYYY-MM-DD' },
      'admin-user-1',
      '127.0.0.1',
      'agent',
    );
    expect(updated.applicationName).toBe('NewName');

    const auditInsert = mockDb.queries.find(
      (q: any) => q.text.includes('INSERT INTO audit_logs') && q.params?.[1] === 'general_updated',
    );
    expect(auditInsert).toBeDefined();

    const settingsUpsert = mockDb.queries.find((q: any) => q.text.includes('INSERT INTO settings'));
    expect(settingsUpsert).toBeDefined();
  });

  it('rejects invalid update payloads', async () => {
    mockSettingsRows([]);
    const svc = await import('../src/admin/settings/service.ts');
    await expect(
      svc.updateSettings('security', { minimumLength: 2 }, 'admin-user-1'),
    ).rejects.toThrow();
  });
});
