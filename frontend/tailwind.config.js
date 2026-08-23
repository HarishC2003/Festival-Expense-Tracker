/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          hover:   '#4F46E5',
          light:   '#818CF8',
          50:      '#EEF2FF',
          100:     '#E0E7FF',
          200:     '#C7D2FE',
          500:     '#6366F1',
          600:     '#4F46E5',
          700:     '#4338CA',
          foreground: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#1E293B',
          elevated:'#253347',
          overlay: '#0D1526',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.10)',
          subtle:  'rgba(255,255,255,0.06)',
          strong:  'rgba(255,255,255,0.18)',
        },
        // Old app aliases mapped to new system
        ground: "#0F172A",
        brass: {
          DEFAULT: "#6366F1",
          foreground: "#FFFFFF",
        },
        kumkum: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        turmeric: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
        },
        oillamp: {
          DEFAULT: "#22D3EE",
          foreground: "#FFFFFF",
        },
        textPrimary: "#F1F5F9",
        textSecondary: "#94A3B8",
        
        // Shadcn UI overrides mapped directly
        input: "rgba(255,255,255,0.10)",
        ring: "#6366F1",
        background: "#0F172A",
        foreground: "#F1F5F9",
        secondary: {
          DEFAULT: "rgba(255,255,255,0.10)",
          foreground: "#F1F5F9",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#253347",
          foreground: "#F1F5F9",
        },
        popover: {
          DEFAULT: "rgba(30, 41, 59, 0.8)",
          foreground: "#F1F5F9",
        },
        card: {
          DEFAULT: "rgba(30, 41, 59, 0.6)",
          foreground: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '16px', letterSpacing: '0.02em' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '22px' }],
        'lg':   ['16px', { lineHeight: '24px' }],
        'xl':   ['18px', { lineHeight: '28px' }],
        '2xl':  ['22px', { lineHeight: '32px' }],
        '3xl':  ['28px', { lineHeight: '36px' }],
        '4xl':  ['36px', { lineHeight: '44px' }],
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'modal': '0 25px 50px rgba(0,0,0,0.8)',
        'glow':  '0 0 20px rgba(99,102,241,0.3)',
        'glow-sm':'0 0 10px rgba(99,102,241,0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, #1E293B 0%, #162032 100%)',
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulseSlow 10s ease-in-out infinite alternate',
        'spin-slow':  'spin 3s linear infinite',
        'bounce-sm':  'bounceSm 1s infinite',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        pulseSlow: {
          '0%': { opacity: '0.4', transform: 'scale(1)' },
          '100%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
