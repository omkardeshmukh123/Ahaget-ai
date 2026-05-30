/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F5EEFF',
          100: '#EBD9FF',
          200: '#D5AAFF',
          500: '#8A2BE2',
          600: '#7B22C9',
          700: '#6B1CAE',
        },
      },
    },
  },
  plugins: [],
};
