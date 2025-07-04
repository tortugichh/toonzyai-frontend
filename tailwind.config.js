// Tailwind CSS v4 clean configuration for ToonzyAI
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* Brand palette */
      colors: {
        brand: {
          light: '#6366F1',   // Indigo 500
          DEFAULT: '#4338CA', // Indigo 600
          dark: '#312E81',    // Indigo 800
        },
        accent: {
          light: '#F59E0B',   // Amber 500
          DEFAULT: '#D97706', // Amber 600
          dark: '#92400E',    // Amber 800
        },
        neutral: {
          50:  '#FFFFFF',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      /* Simple scale for headings */
      fontSize: {
        'h1': ['3.75rem', { lineHeight: '1.1', fontWeight: '800' }], // 60px
        'h2': ['3rem',    { lineHeight: '1.15', fontWeight: '800' }], // 48px
        'h3': ['2.25rem', { lineHeight: '1.25', fontWeight: '700' }], // 36px
        'h4': ['1.875rem',{ lineHeight: '1.3',  fontWeight: '700' }], // 30px
        'body-lg': ['1.125rem', { lineHeight: '1.6' }], // 18px
      },
      /* Simple box-shadow helpers */
      boxShadow: {
        card: '0 6px 16px rgba(0,0,0,0.08)',
        btn:  '0 3px 8px rgba(0,0,0,0.15)',
      },
      /* Gradient animation */
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #6366F1 0%, #4338CA 50%, #6366F1 100%)',
      },
      animation: {
        'gradient-x': 'gradient-x 8s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}; 