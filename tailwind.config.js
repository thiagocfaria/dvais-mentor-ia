/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './componentes/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0a0f2e",
        secondary: "#000514",
        accent: "#3b82f6"
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'fire-flicker': 'fire-flicker 0.3s ease-in-out infinite',
        'smoke-rise': 'smoke-rise 1s ease-out infinite',
        'rocket-lift': 'rocket-lift 0.5s ease-out',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 0 20px rgba(59, 130, 246, 0.5)' },
          '50%': { 'box-shadow': '0 0 40px rgba(59, 130, 246, 0.8)' }
        },
        'float': {
          '0%, 100%': { 'transform': 'translateY(0px)' },
          '50%': { 'transform': 'translateY(-20px)' }
        },
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'fire-flicker': {
          '0%, 100%': { 'opacity': '0.9', 'transform': 'scaleY(1)' },
          '25%': { 'opacity': '1', 'transform': 'scaleY(1.1)' },
          '50%': { 'opacity': '0.8', 'transform': 'scaleY(0.95)' },
          '75%': { 'opacity': '1', 'transform': 'scaleY(1.05)' }
        },
        'smoke-rise': {
          '0%': { 'opacity': '0.6', 'transform': 'translateY(0) scale(1)' },
          '50%': { 'opacity': '0.4', 'transform': 'translateY(-2px) scale(1.1)' },
          '100%': { 'opacity': '0.3', 'transform': 'translateY(-4px) scale(1.2)' }
        },
        'rocket-lift': {
          '0%': { 'transform': 'translateY(0)' },
          '100%': { 'transform': 'translateY(-4px)' }
        },
        'pulse-slow': {
          '0%, 100%': { 'opacity': '1', 'transform': 'scale(1)' },
          '50%': { 'opacity': '0.8', 'transform': 'scale(1.05)' }
        },
        'shimmer': {
          '0%': { 'background-position': '-1000px 0' },
          '100%': { 'background-position': '1000px 0' }
        }
      }
    },
  },
  plugins: [],
}

