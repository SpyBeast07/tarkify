import { theme } from '../styles/theme.js';

export interface SignatureProps {
  name?: string;
  role?: string;
}

export function Signature(props?: SignatureProps): string {
  const { name = 'The Tarkify Team', role } = props ?? {};
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${theme.spacing.lg} 0;">
      <tr>
        <td style="padding:${theme.spacing.md} 0;">
          <p style="
            font-family:${theme.fonts.body};
            font-size:14px;
            color:${theme.colors.text};
            margin:0;
            line-height:1.5;
          ">
            Best regards,
          </p>
          <p style="
            font-family:${theme.fonts.accent};
            font-size:15px;
            font-weight:600;
            color:${theme.colors.darkGreen};
            margin:${theme.spacing.xs} 0 0 0;
            line-height:1.5;
          ">
            ${escapeHtml(name)}
          </p>
          ${role ? `
            <p style="
              font-family:${theme.fonts.body};
              font-size:13px;
              color:${theme.colors.textMuted};
              margin:0;
              line-height:1.5;
            ">${escapeHtml(role)}</p>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
