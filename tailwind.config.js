/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0e1e2e',
        navy: '#0b2239',
        teal: '#0e7c6b',
        'teal-dark': '#0a5e52',
        paper: '#f6f8f7',
        mint: '#e3f0eb',
        gold: '#c8a24b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14,30,46,.05), 0 8px 24px -8px rgba(14,30,46,.12)',
        lift: '0 2px 4px rgba(14,30,46,.05), 0 16px 40px -12px rgba(14,30,46,.18)',
      },
    },
  },
  plugins: [],
};
