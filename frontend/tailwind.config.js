export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface palette - Deep Slate dark mode
        'surface': '#0b1326',
        'surface-dim': '#0b1326',
        'surface-bright': '#31394d',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',

        // Text colors
        'on-surface': '#dae2fd',
        'on-surface-variant': '#bbcabf',
        'inverse-surface': '#dae2fd',
        'inverse-on-surface': '#283044',

        // Outlines
        'outline': '#86948a',
        'outline-variant': '#3c4a42',
        'surface-tint': '#4edea3',

        // Primary (Financial Green) - for growth, profit, success
        'primary': '#4edea3',
        'on-primary': '#003824',
        'primary-container': '#10b981',
        'on-primary-container': '#00422b',
        'inverse-primary': '#006c49',
        'primary-fixed': '#6ffbbe',
        'primary-fixed-dim': '#4edea3',
        'on-primary-fixed': '#002113',
        'on-primary-fixed-variant': '#005236',

        // Secondary (Alert Red) - for loss, alerts
        'secondary': '#ffb2b7',
        'on-secondary': '#67001b',
        'secondary-container': '#b50036',
        'on-secondary-container': '#ffc2c4',
        'secondary-fixed': '#ffdadb',
        'secondary-fixed-dim': '#ffb2b7',
        'on-secondary-fixed': '#40000d',
        'on-secondary-fixed-variant': '#92002a',

        // Tertiary (Data Blue) - for neutral trends
        'tertiary': '#adc6ff',
        'on-tertiary': '#002e6a',
        'tertiary-container': '#71a1ff',
        'on-tertiary-container': '#00367a',
        'tertiary-fixed': '#d8e2ff',
        'tertiary-fixed-dim': '#adc6ff',
        'on-tertiary-fixed': '#001a42',
        'on-tertiary-fixed-variant': '#004395',

        // Error
        'error': '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',

        // Background
        'background': '#0b1326',
        'on-background': '#dae2fd',
        'surface-variant': '#2d3449',
      },
      fontFamily: {
        'geist': ['Geist', 'sans-serif'],
        'geist-mono': ['JetBrains Mono', 'monospace'],
        'display': ['Geist', 'sans-serif'],
        'headline-lg': ['Geist', 'sans-serif'],
        'headline-md': ['Geist', 'sans-serif'],
        'body-lg': ['Geist', 'sans-serif'],
        'body-md': ['Geist', 'sans-serif'],
        'body-sm': ['Geist', 'sans-serif'],
        'table-data': ['Geist', 'sans-serif'],
        'mono-label': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'mono-label': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'table-data': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
      borderRadius: {
        'sm': '0.0625rem',
        'DEFAULT': '0.125rem',
        'md': '0.25rem',
        'lg': '0.25rem',
        'xl': '0.5rem',
        '2xl': '0.75rem',
        'full': '9999px',
      },
      spacing: {
        'unit': '4px',
        'gutter': '12px',
      },
      width: {
        'sidebar': '260px',
        'sidebar-collapsed': '64px',
      },
      height: {
        'row-dense': '32px',
        'row-standard': '48px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(180deg, rgba(78, 222, 163, 0.2) 0%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
