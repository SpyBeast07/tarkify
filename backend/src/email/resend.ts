/**
 * Resend email provider.
 *
 * Wraps the Resend SDK behind the EmailProvider interface.
 * In non-production environments, emails are logged but not sent.
 * No route imports Resend directly — use the EmailService instead.
 *
 * Features:
 * - Graceful timeout (10s)
 * - Structured error mapping
 * - Config-based reply-to
 */

import { Resend } from 'resend';
import { config } from '../config.js';
import type { EmailProvider } from './provider.js';
import type { SendEmailOptions, SendEmailResult } from './types.js';
import { EmailProviderError, EmailConfigurationError, EmailRateLimitError } from './errors.js';

const SEND_TIMEOUT_MS = 10_000;

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private client: Resend | null = null;
  private ready = false;

  constructor() {
    if (!config.email.resendApiKey) {
      if (config.nodeEnv === 'production') {
        throw new EmailConfigurationError(
          'RESEND_API_KEY is required in production'
        );
      }
      return;
    }

    this.client = new Resend(config.email.resendApiKey);
    this.ready = true;
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const to = Array.isArray(options.to)
      ? options.to.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)).join(', ')
      : options.to.name
        ? `${options.to.name} <${options.to.email}>`
        : options.to.email;

    if (!this.ready || !this.client) {
      console.info(
        `[ResendProvider] Dev mode — email logged:\n` +
        `  To:      ${to}\n` +
        `  Subject: ${options.subject}\n` +
        `  HTML:    ${options.html.slice(0, 200)}${options.html.length > 200 ? '...' : ''}`
      );

      return {
        id: crypto.randomUUID(),
        provider: this.name,
        timestamp: new Date(),
        to,
        subject: options.subject,
        status: 'logged',
      };
    }

    const from = options.from
      ? options.from.name
        ? `${options.from.name} <${options.from.email}>`
        : options.from.email
      : config.email.fromEmail;

    const toList = Array.isArray(options.to)
      ? options.to.map((a) => a.email)
      : options.to.email;

    const replyTo = options.replyTo
      ? options.replyTo.name
        ? `${options.replyTo.name} <${options.replyTo.email}>`
        : options.replyTo.email
      : config.email.replyToEmail || undefined;

    const attachments = options.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Buffer ? a.content.toString('base64') : a.content,
      contentType: a.contentType,
    }));

    const sendPromise = this.client.emails.send({
      from,
      to: toList,
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    } as any);

    let response;

    try {
      response = await Promise.race([
        sendPromise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new EmailProviderError(this.name, 'Request timed out', 408)),
            SEND_TIMEOUT_MS
          )
        ),
      ]);
    } catch (err) {
      if (err instanceof EmailProviderError) throw err;
      throw new EmailProviderError(
        this.name,
        err instanceof Error ? err.message : 'Unknown Resend error'
      );
    }

    if (response.error) {
      throw this.mapResendError(response.error);
    }

    return {
      id: response.data.id,
      provider: this.name,
      timestamp: new Date(),
      to,
      subject: options.subject,
      status: 'sent',
    };
  }

  private mapResendError(error: { message: string; name?: string }): EmailProviderError {
    const { message, name } = error;
    switch (name) {
      case 'rate_limit_exceeded':
        return new EmailRateLimitError(this.name, message);
      case 'missing_api_key':
      case 'invalid_api_Key':
      case 'invalid_from_address':
      case 'validation_error':
        return new EmailProviderError(this.name, message, 422);
      case 'not_found':
        return new EmailProviderError(this.name, message, 404);
      case 'application_error':
      case 'internal_server_error':
        return new EmailProviderError(this.name, message, 500);
      default:
        return new EmailProviderError(this.name, message);
    }
  }
}
