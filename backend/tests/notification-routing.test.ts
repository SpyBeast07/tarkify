import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { emailService } from '../src/email/index.js';
import { resetSettingsCache } from '../src/admin/settings/service.js';
import { mockDb } from './helpers.ts';

// Verifies notification routing WITHOUT leaking module mocks into other files:
//   - Phase 2: customer transactional emails always send, regardless of toggles.
//   - Phase 3: each admin-notification toggle independently controls only its
//     corresponding admin notification.
// Drives settings through the real service (via mockDb) and counts email sends
// by spying on the shared emailService singleton (restored in afterEach).

const EMAIL_METHODS = [
  'sendContactAcknowledgement',
  'sendContactNotification',
  'sendFeedbackNotification',
  'sendFeedbackAcknowledgement',
  'sendCareerAcknowledgement',
  'sendAdminNotification',
  'sendPurchaseReceipt',
  'sendDownloadEmail',
  'sendNewsletterConfirmation',
  'sendNewsletterUnsubscribed',
] as const;

const calls: Record<string, number> = {};
const originals: Record<string, any> = {};

const allOn = {
  adminEmailAlerts: true,
  paymentAlerts: true,
  feedbackAlerts: true,
  contactAlerts: true,
  careerAlerts: true,
  newsletterAlerts: true,
  systemAlerts: true,
};
const allOff = Object.fromEntries(Object.keys(allOn).map((k) => [k, false]));

function withSettings(notif: Record<string, boolean>) {
  mockDb.queryMock.mockImplementation((text: string) => {
    if (text.includes('FROM settings')) {
      return Promise.resolve({
        rows: [{ key: 'notifications', value: notif, updated_at: new Date(), updated_by: null }],
        rowCount: 1,
      });
    }
    if (text.includes('INSERT INTO contact_messages')) return Promise.resolve({ rows: [{ id: 'c1' }], rowCount: 1 });
    if (text.includes('INSERT INTO career_applications')) return Promise.resolve({ rows: [{ id: 'c1' }], rowCount: 1 });
    if (text.includes('INSERT INTO newsletter_subscribers')) return Promise.resolve({ rows: [{ id: 'c1' }], rowCount: 1 });
    if (text.includes('INSERT INTO feedback')) return Promise.resolve({ rows: [{ id: 'f1' }], rowCount: 1 });
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
}

// Email sends are fire-and-forget (not awaited by the services), so flush
// pending microtasks before asserting on the call counters.
const flush = () => new Promise((r) => setTimeout(r, 10));

beforeEach(() => {
  for (const m of EMAIL_METHODS) {
    originals[m] = (emailService as any)[m];
    (emailService as any)[m] = () => {
      calls[m] = (calls[m] ?? 0) + 1;
      return Promise.resolve({ id: 'email-1' });
    };
  }
  for (const k of Object.keys(calls)) delete calls[k];
  mockDb.reset();
  resetSettingsCache();
});

afterEach(() => {
  for (const m of EMAIL_METHODS) (emailService as any)[m] = originals[m];
});

describe('Notification routing', () => {
  it('Phase 2: contact acknowledgement always sends even with all toggles OFF', async () => {
    withSettings(allOff);
    const { submitContact } = await import('../src/communication/contact/service.js');
    await submitContact(
      { name: 'Jane', email: 'jane@example.com', subject: 'Hi', message: 'Hello there' },
      '1.2.3.4',
      'agent',
    );
    await flush();
    expect(calls.sendContactAcknowledgement).toBe(1);
    expect(calls.sendContactNotification ?? 0).toBe(0);
  });

  it('Phase 2: career acknowledgement always sends even with all toggles OFF', async () => {
    withSettings(allOff);
    const { submitCareerApplication } = await import('../src/communication/careers/service.js');
    await submitCareerApplication(
      { name: 'Bob', email: 'bob@example.com', phone: '1234567890', resume_url: 'https://example.com/r.pdf' },
      '1.2.3.4',
      'agent',
    );
    await flush();
    expect(calls.sendCareerAcknowledgement).toBe(1);
    expect(calls.sendAdminNotification ?? 0).toBe(0);
  });

  it('Phase 2: newsletter confirmation always sends even with all toggles OFF', async () => {
    withSettings(allOff);
    const { subscribeToNewsletter } = await import('../src/communication/newsletter/service.js');
    await subscribeToNewsletter({ email: 'sub@example.com' }, '1.2.3.4', 'agent');
    await flush();
    expect(calls.sendNewsletterConfirmation).toBe(1);
    expect(calls.sendAdminNotification ?? 0).toBe(0);
  });

  it('Phase 3: contact admin notification only when contactAlerts is ON', async () => {
    withSettings({ ...allOff, contactAlerts: true });
    const { submitContact } = await import('../src/communication/contact/service.js');
    await submitContact(
      { name: 'Jane', email: 'jane@example.com', subject: 'Hi', message: 'Hello there' },
      '1.2.3.4',
      'agent',
    );
    await flush();
    expect(calls.sendContactNotification).toBe(1);
    expect(calls.sendContactAcknowledgement).toBe(1);
  });

  it('Phase 3: career admin notification only when careerAlerts is ON', async () => {
    withSettings({ ...allOff, careerAlerts: true });
    const { submitCareerApplication } = await import('../src/communication/careers/service.js');
    await submitCareerApplication(
      { name: 'Bob', email: 'bob@example.com', phone: '1234567890', resume_url: 'https://example.com/r.pdf' },
      '1.2.3.4',
      'agent',
    );
    await flush();
    expect(calls.sendAdminNotification).toBe(1);
    expect(calls.sendCareerAcknowledgement).toBe(1);
  });

  it('Phase 3: newsletter admin notification only when newsletterAlerts is ON', async () => {
    withSettings({ ...allOff, newsletterAlerts: true });
    const { subscribeToNewsletter } = await import('../src/communication/newsletter/service.js');
    await subscribeToNewsletter({ email: 'sub@example.com' }, '1.2.3.4', 'agent');
    await flush();
    expect(calls.sendAdminNotification).toBe(1);
    expect(calls.sendNewsletterConfirmation).toBe(1);
  });

  it('Phase 3: feedback admin notification only when feedbackAlerts is ON', async () => {
    withSettings({ ...allOff, feedbackAlerts: true });
    const { submitFeedback } = await import('../src/communication/feedback/service.js');
    await submitFeedback(
      { name: 'Ed', email: 'ed@example.com', product: 'devbeast', rating: 5, message: 'Great' },
      '1.2.3.4',
      'agent',
    );
    await flush();
    expect(calls.sendFeedbackNotification).toBe(1);
    expect(calls.sendFeedbackAcknowledgement).toBe(1);
  });
});
