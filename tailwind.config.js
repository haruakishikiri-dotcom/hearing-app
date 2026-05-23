/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8ec',
          100: '#fef3d0',
          200: '#fde3a3',
          300: '#fbcd6c',
          400: '#f8b13a',
          500: '#f5a623',
          600: '#e09310',
          700: '#b9760c',
          800: '#945c0d',
        },
        ink: {
          900: '#1c1c1e',
          700: '#3f3f46',
          500: '#6b7280',
          300: '#d1d5db',
          100: '#f5f6f8',
        },
      },
      fontFamily: {
        sans: [
          'Noto Sans JP',
          'Hiragino Kaku Gothic Pro',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 4px 14px rgba(15, 23, 42, 0.06)',
        pop: '0 10px 30px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
