import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { NewsletterUnsubscribedEmailData } from '../types.js';

export function buildNewsletterUnsubscribedEmail(data: NewsletterUnsubscribedEmailData): string {
  const name = data.userName ?? 'there';

  return EmailLayout({
    title: 'Subscription removed',
    previewText: 'You\'ve been unsubscribed from the Tarkify newsletter.',
    children: `
      ${Header({ title: 'Subscription removed' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              You've been unsubscribed from the Tarkify newsletter. You won't receive any more marketing emails from us.
            </p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              If you change your mind, you're welcome to subscribe again anytime.
            </p>
          </td>
        </tr>
      </table>

      ${Divider()}
      ${Signature({ role: 'Tarkify Updates' })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
