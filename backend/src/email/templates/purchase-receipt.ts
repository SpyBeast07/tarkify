import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { ProductCard } from '../components/ProductCard.js';
import { InfoCard } from '../components/InfoCard.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import type { PurchaseReceiptEmailData } from '../types.js';

export function buildPurchaseReceiptEmail(data: PurchaseReceiptEmailData): string {
  const formattedAmount = (data.amount / 100).toFixed(2);
  const price = `${formattedAmount} ${data.currency}`;

  return EmailLayout({
    title: `Receipt for ${data.productName}`,
    previewText: `Thank you for purchasing ${data.productName}! Your receipt is below.`,
    children: `
      ${Header({ title: 'Thank you for your purchase!', subtitle: `Your receipt for ${data.productName}` })}

      ${ProductCard({
        name: data.productName,
        price,
      })}

      ${InfoCard({ label: 'Amount Paid', value: price })}
      ${InfoCard({ label: 'Email', value: data.email })}

      ${data.receiptUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:0 ${theme.spacing.lg};font-family:${theme.fonts.body};font-size:13px;color:${theme.colors.textMuted};line-height:1.5;">
              <p style="margin:0 0 ${theme.spacing.sm} 0;">
                <a href="${escapeAttr(data.receiptUrl)}" style="color:${theme.colors.accentGreen};text-decoration:underline;">View full receipt</a>
              </p>
            </td>
          </tr>
        </table>
      ` : ''}

      ${Divider()}
      ${Signature({ role: 'Tarkify Support' })}
    `,
  });
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
