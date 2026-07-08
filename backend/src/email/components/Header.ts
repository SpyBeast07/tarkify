import { theme } from '../styles/theme.js';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:${theme.spacing.xl} ${theme.spacing.lg};text-align:center;">
          <span style="
            font-family:${theme.fonts.heading};
            font-size:26px;
            font-weight:700;
            color:${theme.colors.darkGreen};
            letter-spacing:-0.5px;
          ">Tarkify</span>
          ${title ? `
            <h1 style="
              font-family:${theme.fonts.heading};
              font-size:22px;
              font-weight:700;
              color:${theme.colors.text};
              margin:${theme.spacing.lg} 0 0 0;
              line-height:1.3;
            ">${escapeHtml(title)}</h1>
          ` : ''}
          ${subtitle ? `
            <p style="
              font-family:${theme.fonts.body};
              font-size:15px;
              color:${theme.colors.textMuted};
              margin:${theme.spacing.sm} 0 0 0;
              line-height:1.5;
            ">${escapeHtml(subtitle)}</p>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
