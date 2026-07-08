import { theme } from '../styles/theme.js';

export interface ButtonProps {
  href: string;
  text: string;
  variant?: 'primary' | 'secondary';
}

export function Button({ href, text, variant = 'primary' }: ButtonProps): string {
  const bg = variant === 'primary' ? theme.colors.primaryGreen : theme.colors.white;
  const textColor = variant === 'primary' ? theme.colors.white : theme.colors.primaryGreen;
  const border = variant === 'primary' ? 'none' : `1px solid ${theme.colors.primaryGreen}`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${theme.spacing.lg} 0;">
      <tr>
        <td align="center" style="border-radius:${theme.borderRadius.md};background:${bg};${border};">
          <a href="${escapeAttr(href)}"
             target="_blank"
             rel="noopener noreferrer"
             style="
               display:inline-block;
               padding:${theme.button.padding};
               font-family:${theme.fonts.accent};
               font-size:${theme.button.fontSize};
               font-weight:${theme.button.fontWeight};
               color:${textColor};
               text-decoration:none;
               line-height:${theme.button.lineHeight};
             ">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
