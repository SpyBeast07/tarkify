import { buildVerificationEmail } from './templates/verification-email.js';
import { buildPasswordResetEmail } from './templates/password-reset.js';
import { buildPurchaseReceiptEmail } from './templates/purchase-receipt.js';
import { buildDownloadEmail } from './templates/download-email.js';
import { buildContactNotificationEmail } from './templates/contact-notification.js';
import { buildContactAcknowledgementEmail } from './templates/contact-acknowledgement.js';
import { buildFeedbackNotificationEmail } from './templates/feedback-notification.js';
import { buildFeedbackAcknowledgementEmail } from './templates/feedback-acknowledgement.js';
import { buildNewsletterEmail } from './templates/newsletter-email.js';
import { buildNewsletterConfirmationEmail } from './templates/newsletter-confirmation.js';
import { buildNewsletterUnsubscribedEmail } from './templates/newsletter-unsubscribed.js';
import { buildAdminNotificationEmail } from './templates/admin-notification.js';

interface PreviewItem {
  name: string;
  filename: string;
  html: string;
}

function wrapPreview(html: string): string {
  return `<div style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 48px;overflow:hidden;">
    <div style="background:#f9fafb;padding:8px 16px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#6b7280;">
      Rendered in browser — send to Litmus/Email on Acid for real client screenshots
    </div>
    <div style="max-width:640px;margin:0 auto;">${html}</div>
  </div>`;
}

export function renderAllPreviews(): PreviewItem[] {
  const now = new Date().toISOString();

  const verification = buildVerificationEmail({
    email: 'user@example.com',
    verificationUrl: 'https://tarkify.com/verify?token=abc123',
    userName: 'Jane',
  });

  const passwordReset = buildPasswordResetEmail({
    email: 'user@example.com',
    resetUrl: 'https://tarkify.com/reset-password?token=xyz789',
    userName: 'Jane',
  });

  const purchaseReceipt = buildPurchaseReceiptEmail({
    email: 'user@example.com',
    userName: 'Jane',
    productName: 'Premium Course Bundle',
    amount: 2999,
    currency: 'USD',
    razorpayPaymentId: 'pay_ABC123XYZ',
    razorpayOrderId: 'order_DEF456UVW',
    purchaseDate: now,
    receiptUrl: 'https://razorpay.com/receipt/abc',
    accountUrl: 'https://tarkify.com/account',
  });

  const download = buildDownloadEmail({
    email: 'user@example.com',
    userName: 'Jane',
    productName: 'Premium Course Bundle',
    downloadUrl: 'https://tarkify.com/download?token=dl_abc123',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accountUrl: 'https://tarkify.com/account',
  });

  const contactNotification = buildContactNotificationEmail({
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Question about Premium Course Bundle',
    message: "Hi, I'm interested in the Premium Course Bundle but I have a few questions about the curriculum. Specifically, does it cover TypeScript generics in depth? Also, are there any discounts for students?\n\nThanks,\nJane",
  });

  const contactAcknowledgement = buildContactAcknowledgementEmail({
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Question about Premium Course Bundle',
    message: "Hi, I'm interested in the Premium Course Bundle but I have a few questions about the curriculum.",
  });

  const newsletter = buildNewsletterEmail({
    email: 'subscriber@example.com',
    subject: 'March 2026 — New Courses & Updates',
    htmlContent: `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 24px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6;">
            <p style="margin:0 0 16px;">Hello there,</p>
            <p style="margin:0 0 16px;">We've got some exciting updates this month:</p>
            <ul style="margin:0 0 16px;padding-left:20px;">
              <li style="margin-bottom:8px;"><strong>New Course:</strong> Advanced TypeScript Patterns</li>
              <li style="margin-bottom:8px;"><strong>Coming Soon:</strong> React Server Components Deep Dive</li>
              <li style="margin-bottom:8px;"><strong>Community Spotlight:</strong> Featured student projects</li>
            </ul>
            <p style="margin:0 0 16px;">Stay tuned for more great content!</p>
          </td>
        </tr>
      </table>
    `,
  });

  const newsletterConfirmation = buildNewsletterConfirmationEmail({
    email: 'subscriber@example.com',
    userName: 'Jane',
    unsubscribeUrl: 'https://tarkify.com/newsletter/unsubscribe?token=sub_abc123',
  });

  const newsletterUnsubscribed = buildNewsletterUnsubscribedEmail({
    email: 'subscriber@example.com',
    userName: 'Jane',
  });

  const adminNotification = buildAdminNotificationEmail({
    subject: 'New career application received',
    message: 'A new career application has been submitted.',
    metadata: {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+1-555-0123',
      resume_url: 'https://storage.tarkify.com/uploads/resume.pdf',
      portfolio_url: 'https://johnsmith.dev',
    },
  });

  const feedbackNotification = buildFeedbackNotificationEmail({
    name: 'Jane Doe',
    email: 'jane@example.com',
    product: 'DevBeast',
    rating: 5,
    message: "DevBeast has been a game changer for our deployments. The rollback feature alone saved us twice last month!\n\nHighly recommend.",
  });

  const feedbackAcknowledgement = buildFeedbackAcknowledgementEmail({
    name: 'Jane Doe',
    email: 'jane@example.com',
    product: 'DevBeast',
    rating: 5,
    message: "DevBeast has been a game changer for our deployments.",
  });

  return [
    { name: 'Verification Email', filename: 'verification-email', html: wrapPreview(verification) },
    { name: 'Password Reset', filename: 'password-reset', html: wrapPreview(passwordReset) },
    { name: 'Purchase Receipt', filename: 'purchase-receipt', html: wrapPreview(purchaseReceipt) },
    { name: 'Download Email', filename: 'download-email', html: wrapPreview(download) },
    { name: 'Contact Notification (Admin)', filename: 'contact-notification-admin', html: wrapPreview(contactNotification) },
    { name: 'Contact Acknowledgement', filename: 'contact-acknowledgement', html: wrapPreview(contactAcknowledgement) },
    { name: 'Newsletter Broadcast', filename: 'newsletter-broadcast', html: wrapPreview(newsletter) },
    { name: 'Newsletter Confirmation', filename: 'newsletter-confirmation', html: wrapPreview(newsletterConfirmation) },
    { name: 'Newsletter Unsubscribed', filename: 'newsletter-unsubscribed', html: wrapPreview(newsletterUnsubscribed) },
    { name: 'Admin Notification', filename: 'admin-notification', html: wrapPreview(adminNotification) },
    { name: 'Feedback Notification (Admin)', filename: 'feedback-notification-admin', html: wrapPreview(feedbackNotification) },
    { name: 'Feedback Acknowledgement', filename: 'feedback-acknowledgement', html: wrapPreview(feedbackAcknowledgement) },
  ];
}

export function renderPreviewDashboard(): string {
  const items = renderAllPreviews();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Template Previews</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 16px; color: #1a1a1a; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p.subtitle { color: #6b7280; margin-bottom: 32px; }
    .nav { position: sticky; top: 0; background: #f3f4f6; padding: 12px 0; z-index: 10; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
    .nav a { color: #273b09; text-decoration: none; font-size: 13px; padding: 4px 12px; border-radius: 4px; background: #fff; border: 1px solid #e5e7eb; }
    .nav a:hover { background: #f0fdf4; border-color: #273b09; }
    .template-section { scroll-margin-top: 60px; }
    footer { margin-top: 48px; padding: 24px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <h1>Email Template Previews</h1>
  <p class="subtitle">${items.length} templates — rendered with sample data. Use browser DevTools to toggle dark mode and test responsiveness.</p>

  <nav class="nav">
    ${items.map((item) => `<a href="#${item.filename}">${item.name}</a>`).join('\n    ')}
  </nav>

  ${items.map((item) => `
  <section id="${item.filename}" class="template-section">
    <h2 style="font-size:18px;margin-bottom:12px;color:#273b09;">${item.name}</h2>
    ${item.html}
  </section>
  `).join('\n  ')}

  <footer>
    Generated on ${new Date().toISOString()} · View with DevTools device emulation for mobile · Toggle dark mode in OS settings
  </footer>
</body>
</html>`;
}

export function renderPreviewPage(filename: string): string | null {
  const items = renderAllPreviews();
  const item = items.find((i) => i.filename === filename);
  if (!item) return null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${item.name}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  ${item.html}
</body>
</html>`;
}
