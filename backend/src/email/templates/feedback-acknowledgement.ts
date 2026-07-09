import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { InfoCard } from '../components/InfoCard.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { FeedbackEmailData } from '../types.js';

export function buildFeedbackAcknowledgementEmail(data: FeedbackEmailData): string {
  return EmailLayout({
    title: 'We received your feedback',
    previewText: `Thank you for your feedback, ${data.name}.`,
    children: `
      ${Header({ title: 'We received your feedback', subtitle: `Thank you, ${escapeHtml(data.name)}` })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(data.name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              Thank you for sharing your feedback! Our team reviews every submission and uses it to improve Tarkify.
            </p>
          </td>
        </tr>
      </table>

      ${InfoCard({ label: 'Product', value: data.product })}
      ${InfoCard({ label: 'Rating', value: `${data.rating}/5` })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="
                  padding:${theme.spacing.sm} ${theme.spacing.md};
                  background:${theme.colors.lightBg};
                  border-radius:${theme.borderRadius.sm};
                  font-family:${theme.fonts.body};
                  font-size:${theme.fontSizes.base};
                  color:${theme.colors.text};
                  line-height:${theme.lineHeights.relaxed};
                  white-space:pre-wrap;
                ">${escapeHtml(data.message)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.muted.fontFamily};font-size:${theme.text.muted.fontSize};color:${theme.text.muted.color};line-height:${theme.text.muted.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              If you'd like to share more, simply reply to this email.
            </p>
          </td>
        </tr>
      </table>

      ${Divider()}
      ${Signature({ role: 'Tarkify Support' })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
