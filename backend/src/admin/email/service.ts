import * as repo from './repository.js';
import { emailService } from '../../email/index.js';
import { config } from '../../config.js';
import { recordEvent } from '../../audit/service.js';
import { AUDIT_EVENTS } from '../../audit/types.js';
import type {
  EmailListParams,
  EmailListResponse,
  EmailDetail,
  EmailStats,
  ProviderStatus,
  ProviderCurrentStatus,
  TemplateInfo,
  EmailTimelineEvent,
} from './types.js';
import type { EmailLogRecord } from '../../email/log-repository.js';
import type { EmailLogEntry } from '../../email/logger.js';

import { buildVerificationEmail } from '../../email/templates/verification-email.js';
import { buildPasswordResetEmail } from '../../email/templates/password-reset.js';
import { buildPurchaseReceiptEmail } from '../../email/templates/purchase-receipt.js';
import { buildDownloadEmail } from '../../email/templates/download-email.js';
import { buildNewsletterEmail } from '../../email/templates/newsletter-email.js';
import { buildAdminNotificationEmail } from '../../email/templates/admin-notification.js';

function toListResponse(
  emails: EmailLogRecord[],
  total: number,
  page: number,
  perPage: number,
): EmailListResponse {
  return { emails, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

// ─── List / Detail ───────────────────────────────────────────────────────────

export async function listEmails(params: EmailListParams): Promise<EmailListResponse> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { emails, total } = await repo.listEmailLogs({ ...params, page, perPage });
  return toListResponse(emails, total, page, perPage);
}

export async function getEmail(id: string): Promise<EmailDetail | null> {
  const record = await repo.getEmailLogById(id);
  if (!record) return null;

  const metadata = (record.metadata ?? {}) as Record<string, unknown>;
  const retryCount = typeof metadata.retryCount === 'number' ? metadata.retryCount : 0;
  const subject = typeof metadata.subject === 'string' ? metadata.subject : '';

  const timeline = buildTimeline(record, retryCount);

  return {
    ...record,
    fromEmail: config.email.fromEmail,
    replyToEmail: config.email.replyToEmail,
    retryCount,
    htmlPreview: buildPreview(record.template, subject),
    textPreview: null,
    timeline,
  };
}

function buildTimeline(record: EmailLogRecord, retryCount: number): EmailTimelineEvent[] {
  const events: EmailTimelineEvent[] = [];
  const created = record.sent_at ? new Date(record.sent_at).toISOString() : null;

  events.push({ event: 'created', description: 'Email log created', timestamp: created });

  if (record.status === 'sent' || record.status === 'logged') {
    events.push({ event: 'sent', description: `Delivered via ${record.provider}`, timestamp: created });
  } else if (record.status === 'skipped') {
    events.push({ event: 'skipped', description: 'Skipped (recipient opted out or category disabled)', timestamp: created });
  } else if (record.status === 'failed') {
    events.push({
      event: 'failed',
      description: record.error || 'Delivery failed',
      timestamp: created,
    });
  }

  for (let i = 0; i < retryCount; i++) {
    events.push({ event: 'retried', description: `Retry attempt ${i + 1}`, timestamp: null });
  }

  return events;
}

function buildPreview(template: string, subject: string): string | null {
  try {
    const sample = {
      email: 'customer@example.com',
      userName: 'Sample User',
      verificationUrl: `${config.frontendUrl}/verify?token=sample`,
      resetUrl: `${config.frontendUrl}/reset?token=sample`,
      productName: 'Sample Product',
      amount: 1999,
      currency: 'INR',
      razorpayPaymentId: 'pay_sample',
      razorpayOrderId: 'order_sample',
      purchaseDate: new Date().toISOString(),
      receiptUrl: `${config.frontendUrl}/receipt/sample`,
      accountUrl: `${config.frontendUrl}/account`,
      downloadUrl: `${config.frontendUrl}/download/sample`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      subject: subject || 'Sample Subject',
      message: 'This is a sample message body for preview purposes.',
      metadata: {},
      htmlContent: '<p>Sample newsletter content.</p>',
    };

    switch (template) {
      case 'sendVerificationEmail':
        return buildVerificationEmail(sample as any);
      case 'sendPasswordResetEmail':
        return buildPasswordResetEmail(sample as any);
      case 'sendPurchaseReceipt':
        return buildPurchaseReceiptEmail(sample as any);
      case 'sendDownloadEmail':
        return buildDownloadEmail(sample as any);
      case 'admin_reply':
      case 'contact_reply':
        return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;"><h2>Contact Reply</h2><p>${sample.message}</p></body></html>`;
      case 'sendNewsletterEmail':
        return buildNewsletterEmail(sample as any);
      case 'sendAdminNotification':
      case 'sendCareerNotification':
        return buildAdminNotificationEmail(sample as any);
      case 'sendTestEmail':
        return buildVerificationEmail(sample as any);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// ─── Stats / Provider / History ──────────────────────────────────────────────

export async function getStats(): Promise<EmailStats> {
  return repo.getEmailStats();
}

export async function getProviderStatus(): Promise<ProviderStatus> {
  const [lastSuccess, lastFailure] = await Promise.all([
    repo.getLastSuccessAt(),
    repo.getLastFailureAt(),
  ]);

  const configured = Boolean(config.email.resendApiKey);
  let currentStatus: ProviderCurrentStatus = 'unconfigured';
  if (configured) {
    currentStatus = 'operational';
    if (lastFailure) {
      const failedAt = new Date(lastFailure).getTime();
      const recentFailure = Date.now() - failedAt < 24 * 60 * 60 * 1000;
      const successAt = lastSuccess ? new Date(lastSuccess).getTime() : 0;
      if (recentFailure && failedAt > successAt) currentStatus = 'degraded';
    }
  } else {
    currentStatus = 'down';
  }

  return {
    name: config.email.provider,
    currentStatus,
    configured,
    apiKeyPresent: configured,
    fromEmail: config.email.fromEmail,
    replyToEmail: config.email.replyToEmail,
    adminEmail: config.email.adminEmail,
    environment: config.nodeEnv,
    lastSuccessfulAt: lastSuccess,
    lastFailedAt: lastFailure,
  };
}

export async function getHistory(limit = 50): Promise<EmailLogRecord[]> {
  const { emails } = await repo.listEmailLogs({ sort: 'newest', page: 1, perPage: limit });
  return emails;
}

export async function getInMemoryLog(limit = 100): Promise<EmailLogEntry[]> {
  const { emailLogger } = await import('../../email/logger.js');
  return emailLogger.getRecent(limit);
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates(): Promise<TemplateInfo[]> {
  return [
    {
      key: 'sendVerificationEmail',
      name: 'Verification',
      purpose: 'Sent when a user registers and must confirm their email address.',
      variables: ['email', 'verificationUrl', 'userName'],
      previewAvailable: true,
    },
    {
      key: 'sendPasswordResetEmail',
      name: 'Password Reset',
      purpose: 'Sent when a user requests a password reset link.',
      variables: ['email', 'resetUrl', 'userName'],
      previewAvailable: true,
    },
    {
      key: 'sendPurchaseReceipt',
      name: 'Purchase Receipt',
      purpose: 'Sent after a successful purchase with order and receipt details.',
      variables: ['email', 'userName', 'productName', 'amount', 'currency', 'razorpayPaymentId', 'razorpayOrderId', 'purchaseDate', 'receiptUrl', 'accountUrl'],
      previewAvailable: true,
    },
    {
      key: 'sendDownloadEmail',
      name: 'Download',
      purpose: 'Sent with the secure download link after purchase.',
      variables: ['email', 'userName', 'productName', 'downloadUrl', 'expiresAt', 'accountUrl'],
      previewAvailable: true,
    },
    {
      key: 'admin_reply',
      name: 'Contact Reply',
      purpose: 'Admin reply sent to a customer from the Communication Center.',
      variables: ['to', 'subject', 'message'],
      previewAvailable: true,
    },
    {
      key: 'sendNewsletterEmail',
      name: 'Newsletter',
      purpose: 'Marketing or product newsletter sent to subscribers.',
      variables: ['email', 'subject', 'htmlContent'],
      previewAvailable: true,
    },
    {
      key: 'sendAdminNotification',
      name: 'Career / Admin Notification',
      purpose: 'Internal notification to admins (e.g. career application received).',
      variables: ['subject', 'message', 'metadata'],
      previewAvailable: true,
    },
    {
      key: 'sendTestEmail',
      name: 'Test Email',
      purpose: 'Diagnostic email sent from the Admin Email Center.',
      variables: ['email'],
      previewAvailable: true,
    },
  ];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function sendTestEmail(
  recipient: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<{ id: string; status: string }> {
  const result = await emailService.sendTestEmail(recipient);
  await recordEvent(adminUserId, AUDIT_EVENTS.EMAIL_TEST_SENT, {
    recipient,
    provider: result.provider,
  }, ipAddress, userAgent);
  return { id: result.id, status: result.status };
}

export async function resendEmail(
  id: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<{ id: string; status: string }> {
  const record = await repo.getEmailLogById(id);
  if (!record) throw new Error('Email log not found');
  if (record.status !== 'failed') {
    throw new Error('Only failed emails can be resent');
  }

  const subject = ((record.metadata ?? {}) as Record<string, unknown>).subject;
  const subjectStr = typeof subject === 'string' ? subject : 'your email';

  const result = await emailService.sendResend(record.recipient, subjectStr);
  await recordEvent(adminUserId, AUDIT_EVENTS.EMAIL_RESENT, {
    email_log_id: id,
    recipient: record.recipient,
    original_template: record.template,
    provider: result.provider,
  }, ipAddress, userAgent);
  return { id: result.id, status: result.status };
}

export async function recordEmailViewed(
  id: string,
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(adminUserId, AUDIT_EVENTS.EMAIL_VIEWED, { email_log_id: id }, ipAddress, userAgent);
}

export async function recordTemplateViewed(
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(adminUserId, AUDIT_EVENTS.TEMPLATE_VIEWED, {}, ipAddress, userAgent);
}

export async function recordProviderViewed(
  adminUserId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<void> {
  await recordEvent(adminUserId, AUDIT_EVENTS.PROVIDER_VIEWED, {}, ipAddress, userAgent);
}
