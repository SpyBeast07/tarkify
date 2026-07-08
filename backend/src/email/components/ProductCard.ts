import { theme } from '../styles/theme.js';

export interface ProductCardProps {
  name: string;
  description?: string;
  price: string;
}

export function ProductCard({ name, description, price }: ProductCardProps): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${theme.spacing.md} 0;">
      <tr>
        <td style="padding:${theme.spacing.md};border:1px solid ${theme.colors.border};border-radius:${theme.borderRadius.md};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="
                font-family:${theme.fonts.heading};
                font-size:16px;
                font-weight:600;
                color:${theme.colors.text};
                padding-bottom:${theme.spacing.xs};
              ">${escapeHtml(name)}</td>
              <td style="
                font-family:${theme.fonts.accent};
                font-size:16px;
                font-weight:600;
                color:${theme.colors.primaryGreen};
                text-align:right;
                white-space:nowrap;
              ">${escapeHtml(price)}</td>
            </tr>
            ${description ? `
              <tr>
                <td colspan="2" style="
                  font-family:${theme.fonts.body};
                  font-size:14px;
                  color:${theme.colors.textMuted};
                  padding-top:${theme.spacing.xs};
                  line-height:1.5;
                ">${escapeHtml(description)}</td>
              </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
