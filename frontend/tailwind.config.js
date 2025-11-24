/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0F172A',
        'light-blue': '#38BDF8',
      },
      borderRadius: {
        'xl': '1rem',
      }
    },
  },
  plugins: [],
}



