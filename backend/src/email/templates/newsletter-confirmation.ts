import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Divider } from '../components/Divider.js';
import { Footer } from '../components/Footer.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { NewsletterConfirmationEmailData } from '../types.js';

export function buildNewsletterConfirmationEmail(data: NewsletterConfirmationEmailData): string {
  const name = data.userName ?? 'there';

  return EmailLayout({
    title: 'Subscription confirmed',
    previewText: 'You\'re now subscribed to the Tarkify newsletter.',
    children: `
      ${Header({ title: 'Subscription confirmed' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              You're now subscribed to the Tarkify newsletter! We'll send you updates about new products, exclusive offers, and more.
            </p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              If you ever change your mind, you can unsubscribe at any time using the link at the bottom of any email.
            </p>
          </td>
        </tr>
      </table>

      ${Divider()}
      ${Signature({ role: 'Tarkify Updates' })}
      ${Footer({ unsubscribeUrl: data.unsubscribeUrl })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
