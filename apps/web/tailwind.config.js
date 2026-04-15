/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1440px',
    },
    extend: {
      fontFamily: {
        UI: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        /* Unified Minimalist Palette */
        background: '#FFFFFF',
        secondary: '#F8F8F8',
        ink: {
          '50': '#F8F8F8',
          '100': '#F3F4F6',
          '200': '#E5E7EB',
          '400': '#9CA3AF',
          '500': '#6B7280',
          '800': '#1F2937',
          '900': '#0A0A0A',
          'primary': '#0A0A0A',
          'secondary': '#6B7280',
          'border': '#E5E7EB',
        },
        brand: {
          DEFAULT: '#6366F1', // Indigo Accent
          light: '#818CF8',
          dark: '#4F46E5',
        },
        border: '#E5E7EB',
        surface: '#FFFFFF',
        'surface-elevated': '#F8F8F8',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'fade-up': 'fadeUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      boxShadow: {
        'card': '0 4px 16px -4px rgba(0, 0, 0, 0.04), 0 0 1px 0 rgba(0,0,0,0.1)',
        'card-hover': '0 8px 32px -8px rgba(0, 0, 0, 0.08), 0 0 1px 0 rgba(0,0,0,0.1)',
        'float': '0 16px 48px -12px rgba(0, 0, 0, 0.12), 0 0 1px 0 rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
