/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        magenta: {
          400: '#f0abfc',
          500: '#e879f9',
        }
      }
    },
  },
  plugins: [],
};
