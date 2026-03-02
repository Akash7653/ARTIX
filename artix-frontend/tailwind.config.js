/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.1' }],
        sm: ['0.875rem', { lineHeight: '1.25' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.25rem', { lineHeight: '1.625' }],
        '2xl': ['1.5rem', { lineHeight: '1.625' }],
        '3xl': ['1.875rem', { lineHeight: '1.1' }],
        '4xl': ['2.25rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      letterSpacing: {
        tighter: '-0.05rem',
        tight: '-0.025rem',
        normal: '0rem',
        wide: '0.025rem',
        wider: '0.05rem',
        widest: '0.1rem',
      },
    },
  },
  plugins: [],
};
