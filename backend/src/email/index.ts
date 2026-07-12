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
  FeedbackEmailData,
  NewsletterEmailData,
  NewsletterConfirmationEmailData,
  NewsletterUnsubscribedEmailData,
  CareerAcknowledgementEmailData,
  AdminNotificationEmailData,
} from './types.js';

export { theme } from './styles/theme.js';

export { EmailLayout } from './layout/EmailLayout.js';

export { Header } from './components/Header.js';
export { Footer } from './components/Footer.js';
export { Button } from './components/Button.js';
export { Divider } from './components/Divider.js';
export { InfoCard } from './components/InfoCard.js';
export { ProductCard } from './components/ProductCard.js';
export { CodeBox } from './components/CodeBox.js';
export { Alert } from './components/Alert.js';
export { Signature } from './components/Signature.js';

export { buildVerificationEmail } from './templates/verification-email.js';
export { buildPasswordResetEmail } from './templates/password-reset.js';
export { buildPurchaseReceiptEmail } from './templates/purchase-receipt.js';
export { buildDownloadEmail } from './templates/download-email.js';
export { buildContactNotificationEmail } from './templates/contact-notification.js';
export { buildContactAcknowledgementEmail } from './templates/contact-acknowledgement.js';
export { buildFeedbackNotificationEmail } from './templates/feedback-notification.js';
export { buildFeedbackAcknowledgementEmail } from './templates/feedback-acknowledgement.js';
export { buildNewsletterEmail } from './templates/newsletter-email.js';
export { buildNewsletterConfirmationEmail } from './templates/newsletter-confirmation.js';
export { buildNewsletterUnsubscribedEmail } from './templates/newsletter-unsubscribed.js';
export { buildCareerAcknowledgementEmail } from './templates/career-acknowledgement.js';
export { buildAdminNotificationEmail } from './templates/admin-notification.js';

export { canSendEmail, getEmailPreferences, updateEmailPreferences, extractEmailPreferences } from './preferences/service.js';
export type { EmailCategory, EmailPreferences } from './preferences/types.js';
export { EMAIL_CATEGORIES, DEFAULT_EMAIL_PREFERENCES } from './preferences/types.js';
