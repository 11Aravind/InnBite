/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Important to include all your JS/TS files
  ],
  theme: {
    extend: {
      colors: {
        themePrimary: '#114536',
        themeHover: '#0c382b',
        themeLight: '#e6f4f0',
        themeBorder: '#195947',
        themeDark: '#07241c',
      },
    },
  },
  plugins: [],
}
