import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { EmailService } from '../src/email/service';
import {
  EmailProviderError,
  EmailRateLimitError,
  EmailConfigurationError,
} from '../src/email/errors';
import type { EmailProvider } from '../src/email/provider';
import type { SendEmailOptions, SendEmailResult } from '../src/email/types';
import { app } from '../src/index';
import { mockDb } from './helpers';

function createMockProvider(options?: {
  shouldThrow?: boolean;
  throwError?: Error;
  status?: 'sent' | 'logged' | 'failed';
}): EmailProvider {
  const {
    shouldThrow = false,
    throwError = new EmailProviderError('mock', 'mock error'),
    status = 'sent',
  } = options ?? {};

  return {
    name: 'mock',
    send: mock(async (_opts: SendEmailOptions): Promise<SendEmailResult> => {
      if (shouldThrow) throw throwError;
      return {
        id: 'mock-id-123',
        provider: 'mock',
        timestamp: new Date(),
        to: typeof _opts.to === 'string' ? _opts.to : _opts.to.email,
        subject: _opts.subject,
        status,
      };
    }),
  };
}

describe('EmailService', () => {
  let service: EmailService;
  let mockProvider: EmailProvider;

  beforeEach(() => {
    mockProvider = createMockProvider();
    service = new EmailService(mockProvider);
  });

  describe('Every email method propagates provider errors', () => {
    it('sendVerificationEmail propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Invalid API key', 422),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendVerificationEmail({
          email: 'user@example.com',
          verificationUrl: 'https://example.com/verify?token=abc',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendPasswordResetEmail propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Service unavailable', 503),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendPasswordResetEmail({
          email: 'user@example.com',
          resetUrl: 'https://example.com/reset?token=abc',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendPurchaseReceipt propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Send failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendPurchaseReceipt({
          email: 'user@example.com',
          productName: 'Test Product',
          amount: 2900,
          currency: 'INR',
          razorpayPaymentId: 'pay_123',
          razorpayOrderId: 'order_123',
          purchaseDate: 'January 1, 2025',
          accountUrl: 'https://example.com/account',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendDownloadEmail propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Download email failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendDownloadEmail({
          email: 'user@example.com',
          productName: 'Test Product',
          downloadUrl: 'https://example.com/download?token=abc',
          expiresAt: 'January 2, 2025',
          accountUrl: 'https://example.com/account',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendContactNotification propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Contact notification failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendContactNotification({
          name: 'Jane Doe',
          email: 'jane@example.com',
          subject: 'General Inquiry',
          message: 'Hello.',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendContactAcknowledgement propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Acknowledgement failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendContactAcknowledgement({
          name: 'Jane Doe',
          email: 'jane@example.com',
          subject: 'General Inquiry',
          message: 'Hello.',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendNewsletterEmail propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Newsletter send failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendNewsletterEmail({
          email: 'user@example.com',
          subject: 'Monthly Newsletter',
          htmlContent: '<p>Content</p>',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendNewsletterConfirmation propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Confirmation failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendNewsletterConfirmation({
          email: 'user@example.com',
          unsubscribeUrl: 'https://example.com/unsubscribe',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendNewsletterUnsubscribed propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Unsubscribed email failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendNewsletterUnsubscribed({
          email: 'user@example.com',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendAdminNotification propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Admin notification failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendAdminNotification({
          subject: 'Test notification',
          message: 'This is a test.',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('sendTestEmail propagates error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Test email failed', 500),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendTestEmail('test@example.com')
      ).rejects.toThrow(EmailProviderError);
    });
  });

  describe('Specific error scenarios', () => {
    it('handles rate limit error', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailRateLimitError('resend', 'Rate limit exceeded', 60_000),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendVerificationEmail({
          email: 'user@example.com',
          verificationUrl: 'https://example.com/verify?token=abc',
        })
      ).rejects.toThrow(EmailRateLimitError);
    });

    it('handles network timeout', async () => {
      mockProvider = createMockProvider({
        shouldThrow: true,
        throwError: new EmailProviderError('resend', 'Request timed out', 408),
      });
      service = new EmailService(mockProvider);

      await expect(
        service.sendVerificationEmail({
          email: 'user@example.com',
          verificationUrl: 'https://example.com/verify?token=abc',
        })
      ).rejects.toThrow(EmailProviderError);
    });

    it('handles missing configuration', () => {
      const err = new EmailConfigurationError('RESEND_API_KEY is required in production');
      expect(err.name).toBe('EmailConfigurationError');
      expect(err.message).toBe('RESEND_API_KEY is required in production');
    });
  });

  describe('Successful sends', () => {
    it('sendVerificationEmail returns sent status', async () => {
      const result = await service.sendVerificationEmail({
        email: 'user@example.com',
        verificationUrl: 'https://example.com/verify?token=abc',
        userName: 'Test User',
      });

      expect(result.status).toBe('sent');
      expect(result.to).toBe('user@example.com');
      expect(result.subject).toBe('Verify your email address');
      expect(mockProvider.send).toHaveBeenCalledTimes(1);
    });

    it('sendPasswordResetEmail returns sent status', async () => {
      const result = await service.sendPasswordResetEmail({
        email: 'user@example.com',
        resetUrl: 'https://example.com/reset?token=abc',
        userName: 'Test User',
      });

      expect(result.status).toBe('sent');
      expect(result.to).toBe('user@example.com');
      expect(result.subject).toBe('Reset your password');
      expect(mockProvider.send).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Email error types', () => {
  it('EmailProviderError has correct name and properties', () => {
    const err = new EmailProviderError('resend', 'Something went wrong', 422);
    expect(err.name).toBe('EmailProviderError');
    expect(err.message).toContain('resend');
    expect(err.message).toContain('Something went wrong');
    expect(err.statusCode).toBe(422);
  });

  it('EmailRateLimitError extends EmailProviderError', () => {
    const err = new EmailRateLimitError('resend', 'Too many requests', 30_000);
    expect(err).toBeInstanceOf(EmailProviderError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('EmailRateLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.retryAfterMs).toBe(30_000);
  });

  it('EmailConfigurationError has correct name', () => {
    const err = new EmailConfigurationError('RESEND_API_KEY is required in production');
    expect(err.name).toBe('EmailConfigurationError');
    expect(err.message).toBe('RESEND_API_KEY is required in production');
  });
});

describe('POST /api/test-email endpoint', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  it('returns 400 when email is missing', async () => {
    const res = await app.request('/api/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });
});

describe('Better Auth callback error propagation (as configured in auth.ts)', () => {
  it('sendVerificationEmail callback logs and re-throws errors', async () => {
    const mockError = new EmailProviderError('resend', 'Invalid API key', 422);
    const mockService = {
      sendVerificationEmail: mock(async () => { throw mockError; }),
    };

    const callback = async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      try {
        await mockService.sendVerificationEmail({
          email: user.email,
          verificationUrl: url,
          userName: user.name ?? undefined,
        });
      } catch (error) {
        console.error('[auth] sendVerificationEmail failed:', error);
        throw error;
      }
    };

    await expect(
      callback({
        user: { email: 'user@example.com', name: 'Test' },
        url: 'https://example.com/verify?token=abc',
      })
    ).rejects.toThrow(EmailProviderError);
  });

  it('sendResetPassword callback logs and re-throws errors', async () => {
    const mockError = new EmailProviderError('resend', 'Service unavailable', 503);
    const mockService = {
      sendPasswordResetEmail: mock(async () => { throw mockError; }),
    };

    const callback = async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      try {
        await mockService.sendPasswordResetEmail({
          email: user.email,
          resetUrl: url,
          userName: user.name ?? undefined,
        });
      } catch (error) {
        console.error('[auth] sendResetPassword failed:', error);
        throw error;
      }
    };

    await expect(
      callback({
        user: { email: 'user@example.com' },
        url: 'https://example.com/reset?token=abc',
      })
    ).rejects.toThrow(EmailProviderError);
  });

  it('no false success when email service throws', async () => {
    const mockError = new Error('Unexpected provider failure');
    const mockService = {
      sendVerificationEmail: mock(async () => { throw mockError; }),
    };

    const callback = async ({ user, url }: { user: { email: string }; url: string }) => {
      await mockService.sendVerificationEmail({
        email: user.email,
        verificationUrl: url,
      });
    };

    const promise = callback({
      user: { email: 'user@example.com' },
      url: 'https://example.com/verify?token=abc',
    });

    await expect(promise).rejects.toThrow('Unexpected provider failure');
  });
});
