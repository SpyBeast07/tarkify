import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { InfoCard } from '../components/InfoCard.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { ContactNotificationEmailData } from '../types.js';

export function buildContactNotificationEmail(data: ContactNotificationEmailData): string {
  return EmailLayout({
    title: `Contact form: ${data.subject}`,
    previewText: `New contact form submission from ${data.name}.`,
    children: `
      ${Header({ title: 'New Contact Form Submission', subtitle: `From ${data.name}` })}

      ${InfoCard({ label: 'Name', value: data.name })}
      ${InfoCard({ label: 'Email', value: data.email })}
      ${InfoCard({ label: 'Subject', value: data.subject })}

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
                  font-size:14px;
                  color:${theme.colors.text};
                  line-height:1.6;
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
