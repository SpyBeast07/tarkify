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
        <td style="padding:${theme.card.padding};border:1px solid ${theme.card.borderColor};border-radius:${theme.card.borderRadius};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="
                font-family:${theme.fonts.heading};
                font-size:${theme.fontSizes.lg};
                font-weight:${theme.fontWeights.semibold};
                color:${theme.colors.text};
                padding-bottom:${theme.spacing.xs};
              ">${escapeHtml(name)}</td>
              <td style="
                font-family:${theme.fonts.accent};
                font-size:${theme.fontSizes.lg};
                font-weight:${theme.fontWeights.semibold};
                color:${theme.colors.primaryGreen};
                text-align:right;
                white-space:nowrap;
              ">${escapeHtml(price)}</td>
            </tr>
            ${description ? `
              <tr>
                <td colspan="2" style="
                  font-family:${theme.fonts.body};
                  font-size:${theme.fontSizes.base};
                  color:${theme.colors.textMuted};
                  padding-top:${theme.spacing.xs};
                  line-height:${theme.lineHeights.base};
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
