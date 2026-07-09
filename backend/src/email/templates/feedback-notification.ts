import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { InfoCard } from '../components/InfoCard.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { FeedbackEmailData } from '../types.js';

export function buildFeedbackNotificationEmail(data: FeedbackEmailData): string {
  return EmailLayout({
    title: `Feedback: ${data.product}`,
    previewText: `New feedback from ${data.name} about ${data.product}.`,
    children: `
      ${Header({ title: 'New Feedback Submission', subtitle: `From ${data.name}` })}

      ${InfoCard({ label: 'Name', value: data.name })}
      ${InfoCard({ label: 'Email', value: data.email ?? 'Not provided' })}
      ${InfoCard({ label: 'Product', value: data.product })}
      ${InfoCard({ label: 'Rating', value: `${data.rating}/5` })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:${theme.spacing.sm} ${theme.spacing.lg};">
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

      ${Divider()}
      ${Signature({ role: 'Tarkify System' })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
