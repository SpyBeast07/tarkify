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
            font-size:${theme.logo.fontSize};
            font-weight:${theme.logo.fontWeight};
            color:${theme.colors.darkGreen};
            letter-spacing:${theme.logo.letterSpacing};
          ">Tarkify</span>
          ${title ? `
            <h1 style="
              font-family:${theme.fonts.heading};
              font-size:${theme.fontSizes.xl};
              font-weight:${theme.fontWeights.bold};
              color:${theme.colors.text};
              margin:${theme.spacing.lg} 0 0 0;
              line-height:${theme.lineHeights.tight};
            ">${escapeHtml(title)}</h1>
          ` : ''}
          ${subtitle ? `
            <p style="
              font-family:${theme.fonts.body};
              font-size:${theme.fontSizes.md};
              color:${theme.colors.textMuted};
              margin:${theme.spacing.sm} 0 0 0;
              line-height:${theme.lineHeights.base};
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
