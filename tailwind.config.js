/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // BlackSwarm - Dark primary color
        blackswarm: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#c0c0c0',
          400: '#808080',
          500: '#404040',
          600: '#303030',
          700: '#202020',
          800: '#181818',
          900: '#0f0f0f',
        },
        // Bonfire Red - Main accent color
        bonfire: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626', // Main red from image
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#6b1d1d',
        },
        // Magnolia White - Light backgrounds
        magnolia: {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fdfdfd',
          300: '#fbfbfb',
          400: '#f8f8f8',
          500: '#f5f5f5',
          600: '#e8e8e8',
          700: '#d0d0d0',
          800: '#b8b8b8',
          900: '#a0a0a0',
        },
        // Embers - Secondary red/burgundy
        embers: {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#f9d2d2',
          300: '#f5b0b0',
          400: '#ee8080',
          500: '#b91c1c', // Darker red from image
          600: '#a01818',
          700: '#881515',
          800: '#701212',
          900: '#5d1010',
        },
        // Convenience aliases
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#6b1d1d',
        },
        secondary: {
          50: '#fdf2f2',
          100: '#fce7e7',
          200: '#f9d2d2',
          300: '#f5b0b0',
          400: '#ee8080',
          500: '#b91c1c',
          600: '#a01818',
          700: '#881515',
          800: '#701212',
          900: '#5d1010',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
