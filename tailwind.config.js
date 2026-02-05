/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scaffold: {
          light: '#4A9AB5',
          dark: '#2D6E7E',
          bg: '#0F172A',
        },
      },
    },
  },
  plugins: [],
}
