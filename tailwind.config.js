module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FF4ECF', // Shelby pink
          DEFAULT: '#B600E0', // Shelby purple
          dark: '#7D00B5',
        },
        secondary: {
          light: '#00FFD1', // Shelby aqua
          DEFAULT: '#00D492', // Shelby green
          dark: '#00A16B',
          fox: {
            light: '#FFA657', // Fox light
            DEFAULT: '#FF8800', // Fox orange
            dark: '#CC6E00',   // Fox dark
          },
        },
        brand: {
          light: '#F9E6C9',   // Soft peach (Dribbble start)
          DEFAULT: '#9C4DFF', // Vibrant purple (Dribbble mid)
          dark: '#0A001E',    // Deep violet/near-black (Dribbble end)
        },
        neutral: {
          background: '#FFF8F0',
          muted: '#E0E0E0',
        },
      },
      fontFamily: {
        sans: ['"GT Planar"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 72px
        'display-2': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 60px
        'heading-1': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }], // 48px
        'heading-2': ['2.25rem', { lineHeight: '1.2' }], // 36px
        'heading-3': ['1.875rem', { lineHeight: '1.25' }], // 30px
        'heading-4': ['1.5rem', { lineHeight: '1.3' }], // 24px
        'heading-5': ['1.25rem', { lineHeight: '1.35' }], // 20px
        'body-lg': ['1.125rem', { lineHeight: '1.6' }], // 18px
        'body-base': ['1rem', { lineHeight: '1.7' }], // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.6' }], // 14px
      },
      gradientColorStops: {
        'shelby-start': '#FF4ECF',
        'shelby-mid': '#9C4DFF',
        'shelby-end': '#00FFD1',
        'brand-start': '#F9E6C9',
        'brand-mid': '#9C4DFF',
        'brand-end': '#0A001E',
      },
      backgroundImage: {
        'radial-brand': 'radial-gradient(circle at top left, var(--tw-gradient-stops))',
      },
      borderRadius: {
        panel: '2rem',
      },
      boxShadow: {
        'panel-md': '0 10px 40px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'gradient-xy': 'gradientXY 8s ease infinite',
      },
      keyframes: {
        gradientXY: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}; 