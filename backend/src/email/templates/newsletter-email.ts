import { EmailLayout } from '../layout/EmailLayout.js';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { Divider } from '../components/Divider.js';

import type { NewsletterEmailData } from '../types.js';

export function buildNewsletterEmail(data: NewsletterEmailData): string {
  return EmailLayout({
    title: data.subject,
    previewText: data.subject,
    children: `
      ${Header({ title: data.subject })}
      ${Divider({ spacing: '0' })}

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td>
            ${data.htmlContent}
          </td>
        </tr>
      </table>

      ${Divider()}
      ${Footer()}
    `,
  });
}
