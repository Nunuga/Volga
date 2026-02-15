import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'volga-night': '#061826',
        'volga-teal': '#1ec9a8',
        'volga-lime': '#a5f15b',
        'volga-sand': '#f5f0d7'
      },
      boxShadow: {
        soft: '0 18px 60px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(255,255,255,0.10), 0 18px 60px rgba(0,0,0,0.35), 0 0 90px rgba(30,201,168,0.18)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    },
  },
  plugins: [],
} satisfies Config
