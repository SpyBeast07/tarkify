import { theme } from '../styles/theme.js';

export interface FooterProps {
  unsubscribeUrl?: string;
}

export function Footer(props?: FooterProps): string {
  const { unsubscribeUrl } = props ?? {};
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:${theme.spacing.lg} ${theme.spacing.lg};text-align:center;border-top:1px solid ${theme.colors.border};">
          <p style="
            font-family:${theme.fonts.body};
            font-size:${theme.fontSizes.xs};
            color:${theme.colors.textMuted};
            margin:0 0 ${theme.spacing.xs} 0;
            line-height:${theme.lineHeights.base};
          ">
            Tarkify &mdash; Beautiful digital products
          </p>
          <p style="
            font-family:${theme.fonts.body};
            font-size:${theme.fontSizes.xs};
            color:${theme.colors.textMuted};
            margin:0 0 ${theme.spacing.xs} 0;
            line-height:${theme.lineHeights.base};
          ">
            If you have any questions, reply to this email or contact us at
            <a href="mailto:support@tarkify.qzz.io" style="color:${theme.colors.accentGreen};text-decoration:${theme.link.decoration};">support@tarkify.qzz.io</a>
          </p>
          ${unsubscribeUrl ? `
            <p style="margin:${theme.spacing.sm} 0 0 0;">
              <a href="${escapeAttr(unsubscribeUrl)}" target="_blank" style="
                font-family:${theme.fonts.body};
                font-size:${theme.fontSizes.xs};
                color:${theme.colors.textMuted};
                text-decoration:${theme.link.decoration};
              ">Unsubscribe</a>
            </p>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
