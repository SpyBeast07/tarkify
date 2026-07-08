import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { InfoCard } from '../components/InfoCard.js';
import { theme } from '../styles/theme.js';
import type { AdminNotificationEmailData } from '../types.js';

export function buildAdminNotificationEmail(data: AdminNotificationEmailData): string {
  const metadataHtml = data.metadata
    ? Object.entries(data.metadata)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => InfoCard({ label: k, value: String(v) }))
        .join('\n')
    : '';

  return EmailLayout({
    title: data.subject,
    previewText: data.message.slice(0, 100),
    children: `
      ${Header({ title: data.subject })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};white-space:pre-wrap;">
            ${escapeHtml(data.message)}
          </td>
        </tr>
      </table>

      ${metadataHtml ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:${theme.spacing.md} ${theme.spacing.lg};">
              ${metadataHtml}
            </td>
          </tr>
        </table>
      ` : ''}

      ${Divider()}
      ${Signature({ role: 'Tarkify System' })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
