import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
import { Alert } from '../components/Alert.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { DownloadEmailData } from '../types.js';

export function buildDownloadEmail(data: DownloadEmailData): string {
  const name = data.userName ?? data.email;

  return EmailLayout({
    title: `Download ${data.productName}`,
    previewText: `Your download for ${data.productName} is ready.`,
    children: `
      ${Header({ title: 'Your download is ready!', subtitle: data.productName })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              Your download for <strong>${escapeHtml(data.productName)}</strong> is ready. Click the button below to get your files.
            </p>
          </td>
        </tr>
      </table>

      ${Button({ href: data.downloadUrl, text: 'Download Now' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};">
            ${Alert({ type: 'warning', message: `This download link expires on ${data.expiresAt}. After expiry, you can download again from your account page.` })}
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.muted.fontFamily};font-size:${theme.text.muted.fontSize};color:${theme.text.muted.color};line-height:${theme.text.muted.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.sm} 0;">
              If the button doesn't work, copy and paste this URL into your browser:
            </p>
            <p style="margin:0;word-break:break-all;">
              <a href="${escapeAttr(data.downloadUrl)}" style="color:${theme.link.color};font-size:${theme.link.fontSize};">${escapeHtml(data.downloadUrl)}</a>
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              You can also access all your purchases and re-download files from your account page.
            </p>
          </td>
        </tr>
      </table>

      ${Button({ href: data.accountUrl, text: 'Go to your account', variant: 'secondary' })}

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
