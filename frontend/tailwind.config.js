/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14213D',
          50: '#EEF1F6',
          100: '#D6DCE9',
          200: '#AEB9D3',
          300: '#8697BD',
          400: '#5E74A7',
          500: '#3A5182',
          600: '#2A3C63',
          700: '#14213D',
          800: '#0F192E',
          900: '#0A111F',
        },
        paper: '#F7F6F2',
        marigold: {
          DEFAULT: '#E8A23D',
          light: '#F4C27C',
          dark: '#C57E1F',
        },
        signal: {
          DEFAULT: '#C4453D',
          light: '#E2837C',
        },
        moss: {
          DEFAULT: '#3F7A5C',
          light: '#6EA485',
        },
        slate: {
          DEFAULT: '#5B6472',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
