import { theme } from '../styles/theme.js';

export interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function Alert({ type, message }: AlertProps): string {
  const colorMap: Record<AlertProps['type'], string> = {
    info: theme.colors.info,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  const color = colorMap[type];
  const bg = theme.alertBg[type];

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${theme.spacing.md} 0;">
      <tr>
        <td style="
          padding:${theme.spacing.md};
          background:${bg};
          border-left:4px solid ${color};
          border-radius:${theme.borderRadius.sm};
          font-family:${theme.fonts.body};
          font-size:${theme.fontSizes.base};
          color:${theme.colors.text};
          line-height:${theme.lineHeights.base};
        ">${escapeHtml(message)}</td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
