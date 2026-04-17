/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf5',
          100: '#dcf5e8',
          500: '#22a25a',
          600: '#1a7a4a',
          700: '#155f3a',
        }
      }
    },
  },
  plugins: [],
}
