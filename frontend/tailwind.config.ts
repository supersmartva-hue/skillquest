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
        // Brand palette — deep space gaming aesthetic
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5bcfd',
          400: '#8198fa',
          500: '#6474f5',  // primary
          600: '#4f56e8',
          700: '#4244d4',
          800: '#3638ab',
          900: '#313587',
          950: '#1e1f52',
        },
        accent: {
          gold:    '#FFD700',
          purple:  '#9B59B6',
          emerald: '#2ECC71',
          coral:   '#E74C3C',
          cyan:    '#00D2FF',
        },
        dark: {
          50:  '#f7f8fa',
          100: '#eceef3',
          800: '#1a1d2e',
          850: '#141624',
          900: '#0f1120',
          950: '#090b14',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse at center top, rgba(100, 116, 245, 0.3) 0%, transparent 60%)',
        'card-glow': 'linear-gradient(135deg, rgba(100,116,245,0.1) 0%, rgba(0,0,0,0) 100%)',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-slow':  'bounce 2s infinite',
        'xp-fill':      'xpFill 1.5s ease-out forwards',
        'slide-up':     'slideUp 0.4s ease-out forwards',
        'scale-in':     'scaleIn 0.3s ease-out forwards',
        'confetti':     'confetti 1s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(100, 116, 245, 0.4)' },
          to:   { boxShadow: '0 0 30px rgba(100, 116, 245, 0.8), 0 0 60px rgba(100, 116, 245, 0.3)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        xpFill: {
          from: { width: '0%' },
          to:   { width: 'var(--xp-width)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        confetti: {
          '0%':   { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateY(100px) rotate(720deg)' },
        },
      },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(100, 116, 245, 0.3)',
        'glow-md':  '0 0 20px rgba(100, 116, 245, 0.4)',
        'glow-lg':  '0 0 40px rgba(100, 116, 245, 0.5)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.5)',
        'card':     '0 4px 32px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 48px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}

export default config
