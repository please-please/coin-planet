const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./renderer/pages/**/*.{js,ts,jsx,tsx}', './renderer/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'home-image': "url('/images/main_bg.jpg')",
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
      colors: {
        primary: '#405df6',
        sky: '#14b4ff',
        mint: '#00c6ad',
        secondary: '#6a7f97',
        yellow: '#f4c623',
        gray: {
          100: '#f4f6fb',
          200: '#f4f4f4',
          300: '#f2f2f2',
          400: '#d9d9d9',
          500: '#a8afb7',
        },
        bronze: '#B38261',
        red: '#ff3939',
        'primary-op': 'rgba(64, 93, 246, 0.09)',
      },
    },
  },
  plugins: [],
};
