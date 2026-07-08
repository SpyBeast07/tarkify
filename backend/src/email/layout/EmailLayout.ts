import { theme } from '../styles/theme.js';

export interface EmailLayoutProps {
  title: string;
  previewText?: string;
  children: string;
}

export function EmailLayout({ title, previewText, children }: EmailLayoutProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <style>
    @media only screen and (max-width:600px){
      .email-container{width:100%!important}
      .email-padding{padding-left:16px!important;padding-right:16px!important}
    }
  </style>
  <!--[if !mso]><!-->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <!--<![endif]-->
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="
  margin:0;
  padding:0;
  background:${theme.colors.lightBg};
  font-family:${theme.fonts.body};
">
  ${previewText ? `
  <div style="display:none;font-size:1px;color:${theme.colors.textMuted};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(previewText)}
  </div>
  ` : ''}

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${theme.colors.lightBg};">
    <tr>
      <td align="center" style="padding:${theme.spacing.xl} ${theme.spacing.md};">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="
          max-width:600px;
          width:100%;
          background:${theme.colors.white};
          border-radius:${theme.borderRadius.lg};
          overflow:hidden;
        ">
          <tr>
            <td class="email-padding">
              ${children}
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
