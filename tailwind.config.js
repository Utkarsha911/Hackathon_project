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
        // BIC Brand Palette
        navy: {
          950: '#060d1a',
          900: '#0a1628',
          800: '#0f2040',
          700: '#1b2e5e',
          600: '#243d7d',
          500: '#2d4e9e',
          400: '#4a6bbf',
          300: '#6b8cd4',
          200: '#a0b8e8',
          100: '#d5e2f8',
          50:  '#edf3fc',
        },
        coral: {
          700: '#b84a1a',
          600: '#d4541d',
          500: '#e8622a',
          400: '#f07040',
          300: '#f58a5e',
          200: '#fab39a',
          100: '#fdddd4',
          50:  '#fff4f0',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
