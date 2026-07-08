import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { VerificationEmailData } from '../types.js';

export function buildVerificationEmail(data: VerificationEmailData): string {
  const name = data.userName ?? 'there';

  return EmailLayout({
    title: 'Verify your email address',
    previewText: `Welcome${data.userName ? ', ' + data.userName : ''}! Please verify your email address to get started.`,
    children: `
      ${Header({ title: 'Verify your email address' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:15px;color:${theme.colors.text};line-height:1.6;">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              Thanks for joining Tarkify! Please verify your email address to activate your account and start exploring.
            </p>
          </td>
        </tr>
      </table>

      ${Button({ href: data.verificationUrl, text: 'Verify Email Address' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:13px;color:${theme.colors.textMuted};line-height:1.5;">
            <p style="margin:0 0 ${theme.spacing.sm} 0;">
              If the button above doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin:0;word-break:break-all;">
              <a href="${escapeAttr(data.verificationUrl)}" style="color:${theme.colors.accentGreen};font-size:13px;">${escapeHtml(data.verificationUrl)}</a>
            </p>
          </td>
        </tr>
      </table>

      ${Divider()}
      ${Signature()}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
