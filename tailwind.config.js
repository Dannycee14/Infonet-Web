/** @type {import('tailwindcss').Config} */
export default {
  // Only the pages that actually ship. testing*.html is scratch and would bloat the bundle.
  content: ['./index.html', './services.html', './products.html', './script.js'],
  safelist: ['opacity-0', 'opacity-100', 'visible', 'invisible', 'hidden', 'cursor-pointer'],
  theme: {
    extend: {
      colors: {
        // One blue, one scale. #1c5be4 is the existing brand blue and the theme-color meta.
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#bcd0ff',
          300: '#8eb0ff',
          400: '#5985fb',
          500: '#3465f2',
          600: '#1c5be4',
          700: '#1747bb',
          800: '#173c96',
          900: '#152f6f',
          950: '#0d1c45',
        },
        whatsapp: '#25d366',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px -4px rgba(16,24,40,.08)',
        lift: '0 14px 34px -10px rgba(16,24,40,.22)',
      },
    },
  },
  plugins: [],
};