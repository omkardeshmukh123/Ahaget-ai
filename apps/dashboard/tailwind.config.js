/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  safelist: [
    // Dynamically constructed severity badge classes (insights/page.tsx)
    'bg-red-100', 'text-red-700', 'border-red-200', 'bg-red-500',
    'bg-amber-100', 'text-amber-700', 'border-amber-200', 'bg-amber-400',
    'bg-slate-100', 'text-slate-600', 'border-slate-200', 'bg-slate-400',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          25:  '#FDFAFF',
          50:  '#F5EEFF',
          100: '#EBD9FF',
          200: '#D5AAFF',
          300: '#BE7BFF',
          400: '#A650F5',
          500: '#8A2BE2',
          600: '#7B22C9',
          700: '#6B1CAE',
          800: '#4F1580',
          900: '#2E0C52',
        },
      },
    },
  },
  plugins: [],
};
