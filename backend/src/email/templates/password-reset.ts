import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { Alert } from '../components/Alert.js';
import { theme } from '../styles/theme.js';
import type { PasswordResetEmailData } from '../types.js';

export function buildPasswordResetEmail(data: PasswordResetEmailData): string {
  const name = data.userName ?? 'there';

  return EmailLayout({
    title: 'Reset your password',
    previewText: 'Click the link below to reset your Tarkify password.',
    children: `
      ${Header({ title: 'Reset your password' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:15px;color:${theme.colors.text};line-height:1.6;">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              We received a request to reset the password for your Tarkify account. Click the button below to choose a new password.
            </p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </td>
        </tr>
      </table>

      ${Button({ href: data.resetUrl, text: 'Reset Password' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};">
            ${Alert({ type: 'warning', message: 'This password reset link will expire in 24 hours.' })}
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:13px;color:${theme.colors.textMuted};line-height:1.5;">
            <p style="margin:0 0 ${theme.spacing.sm} 0;">
              If the button doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin:0;word-break:break-all;">
              <a href="${escapeAttr(data.resetUrl)}" style="color:${theme.colors.accentGreen};font-size:13px;">${escapeHtml(data.resetUrl)}</a>
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
