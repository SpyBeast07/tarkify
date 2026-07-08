import { theme } from '../styles/theme.js';

export interface DividerProps {
  spacing?: string;
}

export function Divider(props?: DividerProps): string {
  const spacing = props?.spacing ?? theme.spacing.lg;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:${spacing} ${theme.spacing.lg};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="border-top:1px solid ${theme.colors.border};height:1px;line-height:1px;font-size:1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}
