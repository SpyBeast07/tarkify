import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { Divider } from '../components/Divider.js';
import { Alert } from '../components/Alert.js';
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
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              Thanks for joining Tarkify! Please verify your email address by clicking the button below to activate your account and start exploring.
            </p>
          </td>
        </tr>
      </table>

      ${Button({ href: data.verificationUrl, text: 'Verify Email Address' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.muted.fontFamily};font-size:${theme.text.muted.fontSize};color:${theme.text.muted.color};line-height:${theme.text.muted.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.sm} 0;">
              If the button above doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin:0;word-break:break-all;">
              <a href="${escapeAttr(data.verificationUrl)}" target="_blank" rel="noopener noreferrer" style="color:${theme.link.color};font-size:${theme.link.fontSize};">${escapeHtml(data.verificationUrl)}</a>
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};">
            ${Alert({ type: 'warning', message: 'This verification link expires in 24 hours. If you didn\'t create an account, you can safely ignore this email.' })}
          </td>
        </tr>
      </table>

      ${Divider()}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.muted.fontFamily};font-size:${theme.text.muted.fontSize};color:${theme.text.muted.color};line-height:${theme.text.muted.lineHeight};">
            <p style="margin:0;">
              Need help? Contact us at
              <a href="mailto:support@tarkify.qzz.io" style="color:${theme.link.color};text-decoration:${theme.link.decoration};">support@tarkify.qzz.io</a>
            </p>
          </td>
        </tr>
      </table>

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
