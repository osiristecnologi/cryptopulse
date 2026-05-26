/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0a0a0f', secondary: '#12121a', tertiary: '#1a1a2e' },
        neon: { blue: '#00d4ff', green: '#00ff88', pink: '#ff006e', yellow: '#ffd600' },
        surface: { 1: '#16161e', 2: '#1e1e2e', 3: '#2a2a3e' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-green': 'pulseGreen 1s ease-in-out',
        'pulse-red': 'pulseRed 1s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        pulseGreen: { '0%, 100%': { backgroundColor: 'transparent' }, '50%': { backgroundColor: 'rgba(0,255,136,0.15)' } },
        pulseRed: { '0%, 100%': { backgroundColor: 'transparent' }, '50%': { backgroundColor: 'rgba(255,0,110,0.15)' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
