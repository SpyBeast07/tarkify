export { EmailService, emailService } from './service.js';
export { ResendProvider } from './resend.js';
export { EmailLogger, emailLogger } from './logger.js';
export { withRetry, defaultRetryConfig, isRetryableError } from './retry.js';
export {
  EmailError,
  EmailProviderError,
  EmailConfigurationError,
  EmailTemplateError,
  EmailRateLimitError,
} from './errors.js';
export type { EmailProvider } from './provider.js';
export type {
  EmailAddress,
  EmailAttachment,
  SendEmailOptions,
  SendEmailResult,
  VerificationEmailData,
  PasswordResetEmailData,
  PurchaseReceiptEmailData,
  DownloadEmailData,
  ContactNotificationEmailData,
  NewsletterEmailData,
  AdminNotificationEmailData,
} from './types.js';
