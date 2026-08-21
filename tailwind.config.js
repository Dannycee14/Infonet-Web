/** @type {import('tailwindcss').Config} */
export default {
  // Only the pages that actually ship. testing*.html is scratch and would bloat the bundle.
  content: ['./index.html', './services.html', './products.html', './script.js'],
  safelist: ['opacity-0', 'opacity-100', 'visible', 'invisible', 'hidden', 'cursor-pointer'],
  theme: { extend: {} },
  plugins: [],
};
