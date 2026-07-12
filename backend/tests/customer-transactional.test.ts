import { describe, it, expect, mock } from 'bun:test';
import type { EmailProvider } from '../src/email/provider';

// Verifies Phase 2 / Phase 6: customer transactional emails ALWAYS send, even
// when the preference gate (`canSendEmail`) would otherwise skip them. The
// corresponding template categories were set to `null` so they bypass the gate.

const sendMock = mock(async (_opts: any) => ({
  id: 'mock-id',
  provider: 'mock',
  timestamp: new Date(),
  to: 'customer@example.com',
  subject: 'subject',
  status: 'sent',
}));

const mockProvider: EmailProvider = { name: 'mock', send: sendMock };

// Force the preference gate to DENY everything — customer transactional emails
// must still send.
mock.module('../src/email/preferences/service.js', () => ({
  canSendEmail: mock(async () => false),
}));

const { EmailService } = await import('../src/email/service');

const service = new EmailService(mockProvider);

const customerTransactionalMethods: Array<[string, () => Promise<unknown>]> = [
  [
    'sendPurchaseReceipt',
    () =>
      service.sendPurchaseReceipt({
        email: 'customer@example.com',
        productName: 'Test',
        amount: 100,
        currency: 'INR',
        razorpayPaymentId: 'pay_1',
        razorpayOrderId: 'order_1',
        purchaseDate: 'now',
        accountUrl: '/account',
      }),
  ],
  [
    'sendDownloadEmail',
    () =>
      service.sendDownloadEmail({
        email: 'customer@example.com',
        productName: 'Test',
        downloadUrl: '/d',
        expiresAt: 'soon',
        accountUrl: '/account',
      }),
  ],
  [
    'sendContactAcknowledgement',
    () =>
      service.sendContactAcknowledgement({
        name: 'Jane',
        email: 'customer@example.com',
        subject: 'Hi',
        message: 'Hello',
      }),
  ],
  [
    'sendCareerAcknowledgement',
    () =>
      service.sendCareerAcknowledgement({
        name: 'Bob',
        email: 'customer@example.com',
        phone: '123',
        resume_url: 'https://e.com/r.pdf',
      }),
  ],
  [
    'sendVerificationEmail',
    () => service.sendVerificationEmail({ email: 'customer@example.com', verificationUrl: '/v' }),
  ],
  [
    'sendPasswordResetEmail',
    () => service.sendPasswordResetEmail({ email: 'customer@example.com', resetUrl: '/r' }),
  ],
  [
    'sendNewsletterConfirmation',
    () =>
      service.sendNewsletterConfirmation({
        email: 'customer@example.com',
        unsubscribeUrl: '/u',
      }),
  ],
  [
    'sendNewsletterUnsubscribed',
    () => service.sendNewsletterUnsubscribed({ email: 'customer@example.com' }),
  ],
  ['sendTestEmail', () => service.sendTestEmail('customer@example.com')],
];

describe('Customer transactional emails always send', () => {
  for (const [name, run] of customerTransactionalMethods) {
    it(`${name} sends even when canSendEmail denies`, async () => {
      sendMock.mockClear();
      await run();
      expect(sendMock).toHaveBeenCalledTimes(1);
    });
  }
});
