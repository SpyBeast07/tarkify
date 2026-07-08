export const theme = {
  colors: {
    darkGreen: '#002400',
    primaryGreen: '#273b09',
    secondaryGreen: '#58641d',
    accentGreen: '#7b904b',
    lightBg: '#dbd2e0',
    white: '#ffffff',
    text: '#1a1a1a',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    error: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
    info: '#2563eb',
  },

  fonts: {
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    heading: "'Sora', 'Helvetica Neue', Arial, sans-serif",
    accent: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
    mono: "'Courier New', Courier, monospace",
  },

  fontSizes: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '22px',
    xxl: '26px',
    hero: '28px',
  },

  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeights: {
    tight: '1.3',
    base: '1.5',
    relaxed: '1.6',
  },

  letterSpacing: {
    logo: '-0.5px',
    code: '6px',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },

  logo: {
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },

  button: {
    padding: '8px 24px',
    fontSize: '15px',
    fontWeight: '600',
    lineHeight: '24px',
    borderRadius: '8px',
  },

  link: {
    color: '#7b904b',
    decoration: 'underline',
    fontSize: '13px',
  },

  card: {
    padding: '16px',
    borderRadius: '8px',
    borderColor: '#e5e7eb',
  },

  code: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '6px',
  },

  alertBg: {
    info: '#eff6ff',
    success: '#f0fdf4',
    warning: '#fffbeb',
    error: '#fef2f2',
  },

  text: {
    body: {
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: '15px',
      color: '#1a1a1a',
      lineHeight: '1.6',
    },
    muted: {
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: '13px',
      color: '#6b7280',
      lineHeight: '1.5',
    },
  },

  layout: {
    maxWidth: '600px',
    bodyPadding: '32px 16px',
    bodyBg: '#dbd2e0',
    cardBg: '#ffffff',
    cardBorderRadius: '12px',
    responsivePadding: '16px',
  },
} as const;
