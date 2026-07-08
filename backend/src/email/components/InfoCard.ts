import { theme } from '../styles/theme.js';

export interface InfoCardProps {
  label: string;
  value: string;
}

export function InfoCard({ label, value }: InfoCardProps): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${theme.spacing.sm} 0;">
      <tr>
        <td style="padding:${theme.spacing.sm} ${theme.spacing.md};background:${theme.colors.lightBg};border-radius:${theme.borderRadius.sm};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="
                font-family:${theme.fonts.body};
                font-size:13px;
                color:${theme.colors.textMuted};
                padding-bottom:${theme.spacing.xs};
              ">${escapeHtml(label)}</td>
            </tr>
            <tr>
              <td style="
                font-family:${theme.fonts.accent};
                font-size:15px;
                font-weight:600;
                color:${theme.colors.text};
              ">${escapeHtml(value)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
