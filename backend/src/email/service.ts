/**
 * Email Service
 *
 * High-level email API used throughout the application.
 * Each method constructs the appropriate email content and delegates
 * to the configured email provider.
 *
 * No route imports Resend directly — always use this service.
 */

import { config } from '../config.js';
import { ResendProvider } from './resend.js';
import { emailLogger } from './logger.js';
import { withRetry, defaultRetryConfig } from './retry.js';
import type { EmailProvider } from './provider.js';
import type {
  SendEmailResult,
  VerificationEmailData,
  PasswordResetEmailData,
  PurchaseReceiptEmailData,
  DownloadEmailData,
  ContactNotificationEmailData,
  NewsletterEmailData,
  AdminNotificationEmailData,
} from './types.js';

export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider ?? new ResendProvider();
  }

  setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<SendEmailResult> {
    const html = this.buildVerificationHtml(data);
    return this.sendWithLogging(
      data.email,
      'Verify your email address',
      html,
      'sendVerificationEmail'
    );
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult> {
    const html = this.buildPasswordResetHtml(data);
    return this.sendWithLogging(
      data.email,
      'Reset your password',
      html,
      'sendPasswordResetEmail'
    );
  }

  async sendPurchaseReceipt(data: PurchaseReceiptEmailData): Promise<SendEmailResult> {
    const subject = `Receipt for ${data.productName}`;
    const html = this.buildPurchaseReceiptHtml(data);
    return this.sendWithLogging(data.email, subject, html, 'sendPurchaseReceipt');
  }

  async sendDownloadEmail(data: DownloadEmailData): Promise<SendEmailResult> {
    const subject = `Download ${data.productName}`;
    const html = this.buildDownloadHtml(data);
    return this.sendWithLogging(data.email, subject, html, 'sendDownloadEmail');
  }

  async sendContactNotification(data: ContactNotificationEmailData): Promise<SendEmailResult> {
    const html = this.buildContactNotificationHtml(data);
    return this.sendWithLogging(
      config.email.adminEmail,
      `Contact form: ${data.subject}`,
      html,
      'sendContactNotification'
    );
  }

  async sendNewsletterEmail(data: NewsletterEmailData): Promise<SendEmailResult> {
    return this.sendWithLogging(data.email, data.subject, data.htmlContent, 'sendNewsletterEmail');
  }

  async sendAdminNotification(data: AdminNotificationEmailData): Promise<SendEmailResult> {
    const html = this.buildAdminNotificationHtml(data);
    return this.sendWithLogging(
      config.email.adminEmail,
      data.subject,
      html,
      'sendAdminNotification'
    );
  }

  private async sendWithLogging(
    to: string,
    subject: string,
    html: string,
    methodName: string
  ): Promise<SendEmailResult> {
    const start = performance.now();

    try {
      const result = await withRetry(
        () =>
          this.provider.send({
            to: { email: to },
            subject,
            html,
          }),
        defaultRetryConfig
      );

      const duration = Math.round(performance.now() - start);
      emailLogger.info(to, subject, this.provider.name, `${methodName} succeeded`, duration);
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      const message = error instanceof Error ? error.message : 'Unknown error';
      emailLogger.error(to, subject, this.provider.name, `${methodName} failed: ${message}`, duration);
      throw error;
    }
  }

  private buildVerificationHtml(data: VerificationEmailData): string {
    const name = data.userName ?? 'there';
    return `<h1>Verify your email</h1><p>Hi ${this.escapeHtml(name)},</p><p><a href="${this.escapeHtml(data.verificationUrl)}">Verify your email address</a></p>`;
  }

  private buildPasswordResetHtml(data: PasswordResetEmailData): string {
    const name = data.userName ?? 'there';
    return `<h1>Reset your password</h1><p>Hi ${this.escapeHtml(name)},</p><p><a href="${this.escapeHtml(data.resetUrl)}">Reset your password</a></p>`;
  }

  private buildPurchaseReceiptHtml(data: PurchaseReceiptEmailData): string {
    const name = data.userName ?? data.email;
    const formattedAmount = (data.amount / 100).toFixed(2);
    return `<h1>Purchase Receipt</h1><p>Hi ${this.escapeHtml(name)},</p><p>Thank you for purchasing <strong>${this.escapeHtml(data.productName)}</strong> for ${formattedAmount} ${data.currency}.</p>`;
  }

  private buildDownloadHtml(data: DownloadEmailData): string {
    const name = data.userName ?? data.email;
    return `<h1>Download ${this.escapeHtml(data.productName)}</h1><p>Hi ${this.escapeHtml(name)},</p><p><a href="${this.escapeHtml(data.downloadUrl)}">Download ${this.escapeHtml(data.productName)}</a></p>`;
  }

  private buildContactNotificationHtml(data: ContactNotificationEmailData): string {
    return `<h1>Contact Form Submission</h1><p><strong>Name:</strong> ${this.escapeHtml(data.name)}</p><p><strong>Email:</strong> ${this.escapeHtml(data.email)}</p><p><strong>Subject:</strong> ${this.escapeHtml(data.subject)}</p><p><strong>Message:</strong></p><p>${this.escapeHtml(data.message)}</p>`;
  }

  private buildAdminNotificationHtml(data: AdminNotificationEmailData): string {
    let metaHtml = '';
    if (data.metadata) {
      metaHtml = '<h3>Metadata</h3><pre>' + this.escapeHtml(JSON.stringify(data.metadata, null, 2)) + '</pre>';
    }
    return `<h1>${this.escapeHtml(data.subject)}</h1><p>${this.escapeHtml(data.message)}</p>${metaHtml}`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const emailService = new EmailService();
