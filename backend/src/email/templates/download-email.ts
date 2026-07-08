import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Button } from '../components/Button.js';
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
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:15px;color:${theme.colors.text};line-height:1.6;">
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
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:13px;color:${theme.colors.textMuted};line-height:1.5;">
            <p style="margin:0;word-break:break-all;">
              If the button doesn't work, copy and paste this URL:
              <a href="${escapeAttr(data.downloadUrl)}" style="color:${theme.colors.accentGreen};font-size:13px;">${escapeHtml(data.downloadUrl)}</a>
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
