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
} as const;
