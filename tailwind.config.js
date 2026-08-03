/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  safelist: [
    'text-accent-600',
    'underline',
    'hover:no-underline',
    'font-semibold',
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
      // ========================================
      // SHADCN/UI COLORS
      // ========================================
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#fff8f0',
          100: '#ffecd4',
          200: '#ffd5a3',
          300: '#ffb86a',
          400: '#ff9a3c',
          500: '#eabd64',
          600: '#d4a84a',
          700: '#af8226',
          800: '#8c6a1f',
          900: '#6b5119',
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: '#fff0f0',
          100: '#ffdcdc',
          200: '#ffb8b8',
          300: '#f8b2b2',
          400: '#ef3f3f',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#9c0101',
          800: '#7f1d1d',
          900: '#450a0a',
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#28a745',
          600: '#218838',
          700: '#1e7e34',
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        // Sidebar farby
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // Chart farby
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        // Legacy grays
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
      },

      // ========================================
      // BORDER RADIUS
      // ========================================
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ========================================
      // FONTS
      // ========================================
      fontFamily: {
        // Prepísanie na Nunito
        sans: ['"Nunito Variable"', '"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Nunito Variable"', '"Nunito"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Menlo', 'Courier New', 'monospace'],
      },

      // ========================================
      // SHADOWS
      // ========================================
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 40px -10px rgba(234, 189, 100, 0.3)',
      },

      // ========================================
      // SPACING
      // ========================================
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

      // ========================================
      // BACKDROP BLUR
      // ========================================
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },

      // ========================================
      // Z-INDEX
      // ========================================
      zIndex: {
        'dropdown': 1000,
        'sticky': 1020,
        'fixed': 1030,
        'modal': 1040,
        'popover': 1050,
        'tooltip': 1060,
      },

      // ========================================
      // MAX WIDTH
      // ========================================
      maxWidth: {
        'container': '1240px',
        'container-wide': '1400px',
      },

      // ========================================
      // KEYFRAMES
      // ========================================
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
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
      },

      // ========================================
      // ANIMATIONS
      // ========================================
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        dropdownIn: 'dropdownIn 0.18s ease-out forwards',
        dropdownOut: 'dropdownOut 0.14s ease-in forwards',
        mobileMenuIn: 'mobileMenuIn 0.22s ease-out forwards',
        mobileMenuOut: 'mobileMenuOut 0.18s ease-in forwards',
      },

      // ========================================
      // BACKGROUND IMAGES
      // ========================================
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-soft': 'linear-gradient(135deg, rgba(234,189,100,0.08) 0%, rgba(239,63,63,0.05) 100%)',
        // Nové ružovo-modro-žlté fľakaté pozadie
        'custom-flakes': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23fffde7'/%3E%3Cfilter id='blur'%3E%3CfeGaussianBlur stdDeviation='18'/%3E%3C/filter%3E%3Cg filter='url(%23blur)'%3E%3Ccircle cx='80' cy='80' r='55' fill='rgba(147,197,253,0.5)'/%3E%3Ccircle cx='300' cy='60' r='40' fill='rgba(255,150,180,0.5)'/%3E%3Ccircle cx='520' cy='100' r='50' fill='rgba(167,243,208,0.45)'/%3E%3Ccircle cx='150' cy='280' r='65' fill='rgba(255,150,180,0.45)'/%3E%3Ccircle cx='420' cy='250' r='55' fill='rgba(147,197,253,0.5)'/%3E%3Ccircle cx='70' cy='480' r='50' fill='rgba(255,210,80,0.35)'/%3E%3Ccircle cx='320' cy='450' r='60' fill='rgba(147,197,253,0.4)'/%3E%3Ccircle cx='530' cy='420' r='45' fill='rgba(255,150,180,0.45)'/%3E%3Ccircle cx='240' cy='550' r='40' fill='rgba(167,243,208,0.4)'/%3E%3Ccircle cx='460' cy='560' r='35' fill='rgba(255,210,80,0.30)'/%3E%3C/g%3E%3C/svg%3E")`,
      },
    },
  },

  // ========================================
  // PLUGINS
  // ========================================
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      addUtilities({
       '.card-glass': {
  'background': 'rgba(255, 255, 255, 0.92) !important',
  'backdrop-filter': 'blur(4px)',
  '-webkit-backdrop-filter': 'blur(4px)',
  'border-color': 'rgba(255, 255, 255, 0.8) !important',
},
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