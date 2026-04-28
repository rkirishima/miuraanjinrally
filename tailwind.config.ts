import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rally: {
          bg:       '#f5f3ed',
          surf:     '#faf9f5',
          card:     '#ffffff',
          ink:      '#2a2925',
          ink2:     '#6b6860',
          sea:      '#5a8ba3',
          sea2:     '#a8c5d6',
          moss:     '#7da892',
          mossBg:   '#e8f0e8',
          cinnabar: '#a85a3a',
          rule:     'rgba(42,41,37,0.10)',
          // legacy aliases kept for backward compat
          beige:    '#f5f3ed',
        },
      },
      fontFamily: {
        display: ['"Shippori Mincho"', '"Cormorant Garamond"', 'serif'],
        jp:      ['"Shippori Mincho"', 'serif'],
        sans:    ['Inter', '"Noto Sans JP"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        rally:    '0 4px 24px rgba(58,58,55,0.08)',
        'rally-lg':'0 8px 40px rgba(58,58,55,0.12)',
      },
      borderRadius: {
        rally:    '12px',
        'rally-lg':'20px',
      },
      letterSpacing: {
        eyebrow: '0.3em',
        wide2:   '0.18em',
        mono:    '0.08em',
      },
      keyframes: {
        'stamp-in': {
          '0%':   { transform: 'scale(0.4)', opacity: '0' },
          '60%':  { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
      animation: {
        'stamp-in':  'stamp-in 1.5s ease-out forwards',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
