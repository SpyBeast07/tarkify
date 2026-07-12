import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { ProductCard } from '../components/ProductCard.js';
import { InfoCard } from '../components/InfoCard.js';
import { Button } from '../components/Button.js';
import { Divider } from '../components/Divider.js';
import { Signature } from '../components/Signature.js';
import { theme } from '../styles/theme.js';
import { formatPrice } from '../../lib/currency.js';
import type { PurchaseReceiptEmailData } from '../types.js';

export function buildPurchaseReceiptEmail(data: PurchaseReceiptEmailData): string {
  const price = formatPrice(data.amount, data.currency);
  const name = data.userName ?? 'there';

  return EmailLayout({
    title: `Receipt for ${data.productName}`,
    previewText: `Thank you for purchasing ${data.productName}! Your receipt is below.`,
    children: `
      ${Header({ title: 'Thank you for your purchase!', subtitle: `Receipt for ${data.productName}` })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">Hi ${escapeHtml(name)},</p>
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              Your payment was successful. Below are the details of your purchase.
            </p>
          </td>
        </tr>
      </table>

      ${ProductCard({ name: data.productName, price })}

      ${InfoCard({ label: 'Razorpay Payment ID', value: data.razorpayPaymentId })}
      ${InfoCard({ label: 'Order ID', value: data.razorpayOrderId })}
      ${InfoCard({ label: 'Purchase Date', value: data.purchaseDate })}
      ${InfoCard({ label: 'Amount Paid', value: price })}
      ${InfoCard({ label: 'Email', value: data.email })}

      ${data.receiptUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              <a href="${escapeAttr(data.receiptUrl)}" target="_blank" rel="noopener noreferrer" style="color:${theme.link.color};text-decoration:${theme.link.decoration};">View your receipt on Razorpay</a>
            </p>
          </td>
        </tr>
      </table>
      ` : ''}

      ${Divider()}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 ${theme.spacing.lg};font-family:${theme.text.body.fontFamily};font-size:${theme.text.body.fontSize};color:${theme.text.body.color};line-height:${theme.text.body.lineHeight};">
            <p style="margin:0 0 ${theme.spacing.md} 0;">
              You can view all your purchases and manage your account from your account page.
            </p>
          </td>
        </tr>
      </table>

      ${Button({ href: data.accountUrl, text: 'Go to your account' })}

      ${Signature({ role: 'Tarkify Support' })}
    `,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
