import { config } from '../config.js';
import { ResendProvider } from './resend.js';
import { emailLogger } from './logger.js';
import { withRetry, defaultRetryConfig } from './retry.js';
import { insertEmailLog } from './log-repository.js';
import { canSendEmail } from './preferences/service.js';
import type { EmailProvider } from './provider.js';
import type { EmailCategory } from './preferences/types.js';
import type {
  SendEmailResult,
  VerificationEmailData,
  PasswordResetEmailData,
  PurchaseReceiptEmailData,
  DownloadEmailData,
  ContactNotificationEmailData,
  NewsletterEmailData,
  NewsletterConfirmationEmailData,
  NewsletterUnsubscribedEmailData,
  AdminNotificationEmailData,
  FeedbackEmailData,
} from './types.js';
import { buildVerificationEmail } from './templates/verification-email.js';
import { buildPasswordResetEmail } from './templates/password-reset.js';
import { buildPurchaseReceiptEmail } from './templates/purchase-receipt.js';
import { buildDownloadEmail } from './templates/download-email.js';
import { buildContactNotificationEmail } from './templates/contact-notification.js';
import { buildContactAcknowledgementEmail } from './templates/contact-acknowledgement.js';
import { buildNewsletterEmail } from './templates/newsletter-email.js';
import { buildNewsletterConfirmationEmail } from './templates/newsletter-confirmation.js';
import { buildNewsletterUnsubscribedEmail } from './templates/newsletter-unsubscribed.js';
import { buildAdminNotificationEmail } from './templates/admin-notification.js';
import { buildFeedbackNotificationEmail } from './templates/feedback-notification.js';
import { buildFeedbackAcknowledgementEmail } from './templates/feedback-acknowledgement.js';

const TEMPLATE_CATEGORIES: Record<string, EmailCategory | null> = {
  sendVerificationEmail: null,        // security — always send
  sendPasswordResetEmail: null,       // security — always send
  sendPurchaseReceipt: 'billing',
  sendDownloadEmail: 'billing',
  sendContactNotification: null,      // goes to admin, not user
  sendContactAcknowledgement: 'product',
  sendFeedbackNotification: null,      // goes to admin, not user
  sendFeedbackAcknowledgement: 'product',
  sendNewsletterConfirmation: null,   // transactional — just subscribed
  sendNewsletterUnsubscribed: null,   // transactional — just unsubscribed
  sendNewsletterEmail: 'newsletter',
  sendAdminNotification: null,        // internal — skip
  sendTestEmail: null,                // dev — skip
};

export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider ?? new ResendProvider();
  }

  setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<SendEmailResult> {
    const html = buildVerificationEmail(data);
    return this.sendWithLogging(data.email, 'Verify your email address', html, 'sendVerificationEmail');
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult> {
    const html = buildPasswordResetEmail(data);
    return this.sendWithLogging(data.email, 'Reset your password', html, 'sendPasswordResetEmail');
  }

  async sendPurchaseReceipt(data: PurchaseReceiptEmailData): Promise<SendEmailResult> {
    const subject = `Receipt for ${data.productName}`;
    const html = buildPurchaseReceiptEmail(data);
    return this.sendWithLogging(data.email, subject, html, 'sendPurchaseReceipt');
  }

  async sendDownloadEmail(data: DownloadEmailData): Promise<SendEmailResult> {
    const subject = `Download ${data.productName}`;
    const html = buildDownloadEmail(data);
    return this.sendWithLogging(data.email, subject, html, 'sendDownloadEmail');
  }

  async sendContactNotification(data: ContactNotificationEmailData): Promise<SendEmailResult> {
    const html = buildContactNotificationEmail(data);
    return this.sendWithLogging(
      config.email.adminEmail,
      `New contact request: ${data.subject}`,
      html,
      'sendContactNotification',
    );
  }

  async sendContactAcknowledgement(data: ContactNotificationEmailData): Promise<SendEmailResult> {
    const html = buildContactAcknowledgementEmail(data);
    return this.sendWithLogging(
      data.email,
      'We received your message',
      html,
      'sendContactAcknowledgement',
    );
  }

  async sendFeedbackNotification(data: FeedbackEmailData): Promise<SendEmailResult> {
    const html = buildFeedbackNotificationEmail(data);
    return this.sendWithLogging(
      config.email.adminEmail,
      `New feedback: ${data.product} (${data.rating}/5)`,
      html,
      'sendFeedbackNotification',
    );
  }

  async sendFeedbackAcknowledgement(data: FeedbackEmailData): Promise<SendEmailResult> {
    const html = buildFeedbackAcknowledgementEmail(data);
    return this.sendWithLogging(
      data.email!,
      'We received your feedback',
      html,
      'sendFeedbackAcknowledgement',
    );
  }

  async sendNewsletterEmail(data: NewsletterEmailData): Promise<SendEmailResult> {
    const html = buildNewsletterEmail(data);
    return this.sendWithLogging(data.email, data.subject, html, 'sendNewsletterEmail');
  }

  async sendNewsletterConfirmation(data: NewsletterConfirmationEmailData): Promise<SendEmailResult> {
    const html = buildNewsletterConfirmationEmail(data);
    return this.sendWithLogging(data.email, 'Subscription confirmed', html, 'sendNewsletterConfirmation');
  }

  async sendNewsletterUnsubscribed(data: NewsletterUnsubscribedEmailData): Promise<SendEmailResult> {
    const html = buildNewsletterUnsubscribedEmail(data);
    return this.sendWithLogging(data.email, 'Subscription removed', html, 'sendNewsletterUnsubscribed');
  }

  async sendAdminNotification(data: AdminNotificationEmailData): Promise<SendEmailResult> {
    const html = buildAdminNotificationEmail(data);
    return this.sendWithLogging(config.email.adminEmail, data.subject, html, 'sendAdminNotification');
  }

  async sendTestEmail(to: string): Promise<SendEmailResult> {
    const html = buildVerificationEmail({
      email: to,
      verificationUrl: `${config.frontendUrl}/verify-test`,
      userName: 'Test User',
    });
    return this.sendWithLogging(to, 'Tarkify — Test email', html, 'sendTestEmail');
  }

  private async sendWithLogging(
    to: string,
    subject: string,
    html: string,
    methodName: string,
  ): Promise<SendEmailResult> {
    const category = TEMPLATE_CATEGORIES[methodName] ?? null;
    if (category !== null) {
      const allowed = await canSendEmail(to, category);
      if (!allowed) {
        emailLogger.info(to, subject, this.provider.name, `${methodName} skipped (${category} opted out)`, 0);
        insertEmailLog(to, methodName, this.provider.name, null, 'skipped', null, { subject, category })
          .catch(() => {});
        return {
          id: crypto.randomUUID(),
          provider: this.provider.name,
          timestamp: new Date(),
          to,
          subject,
          status: 'skipped',
        };
      }
    }

    const start = performance.now();

    try {
      const result = await withRetry(
        () =>
          this.provider.send({
            to: { email: to },
            subject,
            html,
          }),
        defaultRetryConfig,
      );

      const duration = Math.round(performance.now() - start);
      emailLogger.info(to, subject, this.provider.name, `${methodName} succeeded`, duration);
      insertEmailLog(to, methodName, this.provider.name, result.id, result.status, null, { subject })
        .catch(() => {});
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      const message = error instanceof Error ? error.message : 'Unknown error';
      emailLogger.error(to, subject, this.provider.name, `${methodName} failed: ${message}`, duration);
      insertEmailLog(to, methodName, this.provider.name, null, 'failed', message, { subject })
        .catch(() => {});
      throw error;
    }
  }
}

export const emailService = new EmailService();
