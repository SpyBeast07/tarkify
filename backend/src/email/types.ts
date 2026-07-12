/**
 * Email system types and interfaces.
 */

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  replyTo?: EmailAddress;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  id: string;
  provider: string;
  timestamp: Date;
  to: string;
  subject: string;
  status: 'sent' | 'logged' | 'failed' | 'skipped';
}

export interface VerificationEmailData {
  email: string;
  verificationUrl: string;
  userName?: string;
}

export interface PasswordResetEmailData {
  email: string;
  resetUrl: string;
  userName?: string;
}

export interface PurchaseReceiptEmailData {
  email: string;
  userName?: string;
  productName: string;
  amount: number;
  currency: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  purchaseDate: string;
  receiptUrl?: string;
  accountUrl: string;
  /** Optional tax breakdown. When present (tax enabled), the receipt shows it. */
  taxAmount?: number;
  totalAmount?: number;
  taxRate?: number;
}

export interface DownloadEmailData {
  email: string;
  userName?: string;
  productName: string;
  downloadUrl: string;
  expiresAt: string;
  accountUrl: string;
}

export interface ContactNotificationEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface FeedbackEmailData {
  name: string;
  email: string | null;
  product: string;
  rating: number;
  message: string;
}

export interface NewsletterEmailData {
  email: string;
  userName?: string;
  subject: string;
  htmlContent: string;
}

export interface NewsletterConfirmationEmailData {
  email: string;
  userName?: string;
  unsubscribeUrl: string;
}

export interface NewsletterUnsubscribedEmailData {
  email: string;
  userName?: string;
}

export interface CareerAcknowledgementEmailData {
  email: string;
  name: string;
  position: string;
}

export interface AdminNotificationEmailData {
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
}
