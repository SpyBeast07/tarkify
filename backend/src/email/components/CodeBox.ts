import { theme } from '../styles/theme.js';

export interface CodeBoxProps {
  code: string;
  label?: string;
}

export function CodeBox({ code, label }: CodeBoxProps): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${theme.spacing.lg} 0;">
      ${label ? `
        <tr>
          <td style="
            font-family:${theme.fonts.body};
            font-size:13px;
            color:${theme.colors.textMuted};
            padding-bottom:${theme.spacing.sm};
            text-align:center;
          ">${escapeHtml(label)}</td>
        </tr>
      ` : ''}
      <tr>
        <td align="center" style="
          padding:${theme.spacing.md} ${theme.spacing.lg};
          background:${theme.colors.lightBg};
          border-radius:${theme.borderRadius.md};
          font-family:'Courier New',Courier,monospace;
          font-size:28px;
          font-weight:700;
          color:${theme.colors.darkGreen};
          letter-spacing:6px;
        ">${escapeHtml(code)}</td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
