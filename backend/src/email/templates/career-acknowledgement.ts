import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { CareerAcknowledgementEmailData } from '../types.js';

export function buildCareerAcknowledgementEmail(data: CareerAcknowledgementEmailData): string {
  const name = data.name || 'there';

  return EmailLayout({
    title: 'We received your application',
    previewText: `Thank you for applying to Tarkify${data.position ? ` (${data.position})` : ''}!`,
    children: `
      ${Header({ title: 'Application received', subtitle: data.position ? `Position: ${data.position}` : undefined })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              Thank you for your interest in joining Tarkify${
                data.position ? ` as a <strong>${escapeHtml(data.position)}</strong>` : ''
              }. We have received your application and our team will review it shortly.
            </p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              If your profile is a good fit, we will reach out to you by email. Please keep an eye on your inbox.
            </p>
          </td>
        </tr>
      </table>

      ${Divider()}

      ${Button({ href: 'https://tarkify.com', text: 'Visit Tarkify' })}

      ${Signature({ role: 'Tarkify Careers' })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
