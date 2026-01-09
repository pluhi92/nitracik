/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Priehľadné farby
        transparent: 'transparent',
        current: 'currentColor',
        white: '#ffffff',
        black: '#000000',

        // Semi-transparent white colors
        overlay: {
          10: 'rgba(255, 255, 255, 0.1)',
          20: 'rgba(255, 255, 255, 0.2)',
          30: 'rgba(255, 255, 255, 0.3)',
          40: 'rgba(255, 255, 255, 0.4)',
          50: 'rgba(255, 255, 255, 0.5)',
          60: 'rgba(255, 255, 255, 0.6)',
          70: 'rgba(255, 255, 255, 0.7)',
          80: 'rgba(255, 255, 255, 0.8)',
          90: 'rgba(255, 255, 255, 0.9)',
        },

        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          500: '#28a745',
          600: '#218838',
          700: '#1e7e34',
        },
        secondary: {
          50: '#fff3e0',
          400: '#555362',
          500: '#f8b2b2',
          600: '#ef3f3f',
          700: '#9c0101ff',
          800: '#eabd64',
          900: '#af8226ff',
        },
        gray: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#121212',
        },
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8',
      },
      fontFamily: {
        base: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Menlo', 'Courier New', 'monospace'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '250ms',
        'slow': '350ms',
      },
      zIndex: {
        'dropdown': 1000,
        'sticky': 1020,
        'fixed': 1030,
        'modal': 1040,
        'popover': 1050,
        'tooltip': 1060,
      },
      maxWidth: {
        'container': '1240px',
        'container-wide': '1400px',
      },
      backgroundImage: {
        'custom-flakes': `
          radial-gradient(circle at 10% 20%, rgba(234, 189, 100, 0.4) 0%, transparent 20%),
          radial-gradient(circle at 90% 80%, rgba(239, 63, 63, 0.4) 0%, transparent 20%),
          radial-gradient(circle at 50% 50%, rgba(234, 189, 100, 0.3) 0%, transparent 30%),
          radial-gradient(circle at 80% 20%, rgba(239, 63, 63, 0.3) 0%, transparent 25%),
          radial-gradient(circle at 20% 70%, rgba(234, 189, 100, 0.2) 0%, transparent 25%)
        `,
      },

      keyframes: {
        dropdownIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0px) scale(1)' },
        },
        dropdownOut: {
          '0%': { opacity: '1', transform: 'translateY(0px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-10px) scale(0.97)' },
        },
        mobileMenuIn: {
          '0%': { opacity: '0', transform: 'translateY(-15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        mobileMenuOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-15px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        dropdownIn: 'dropdownIn 0.18s ease-out forwards',
        dropdownOut: 'dropdownOut 0.14s ease-in forwards',
        mobileMenuIn: 'mobileMenuIn 0.22s ease-out forwards',
        mobileMenuOut: 'mobileMenuOut 0.18s ease-in forwards',
        fadeIn: 'fadeIn 0.2s ease-out forwards',
      }

    }
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scroll-smooth': {
          'scroll-behavior': 'smooth',
          '-webkit-overflow-scrolling': 'touch',
        },
        '.snap-x': {
          'scroll-snap-type': 'x var(--scroll-snap-strictness)',
        },
        '.snap-mandatory': {
          '--scroll-snap-strictness': 'mandatory',
        },
        '.snap-center': {
          'scroll-snap-align': 'center',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })
    },
  ],
}