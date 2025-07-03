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
        },
      },
      fontFamily: {
        sans: ['"GT Planar"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      gradientColorStops: {
        'shelby-start': '#FF4ECF',
        'shelby-mid': '#9C4DFF',
        'shelby-end': '#00FFD1',
      },
    },
  },
  plugins: [],
}; 