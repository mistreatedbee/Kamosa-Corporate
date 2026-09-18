export default {
  content: ['./**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#353535',
          900: '#353535',
          800: '#4a4a4a',
          700: '#5c5c5c',
        },
        brand: {
          DEFAULT: '#E71B1C',
          600: '#E71B1C',
          500: '#CD1718',
        },
        lime: {
          DEFAULT: '#8CC540',
          soft: '#A9D96D',
        },
        gold: {
          DEFAULT: '#8CC540',
          soft: '#A9D96D',
        },
        cream: '#D9D5D4',
        muted: '#6B6B6B',
        hairline: '#E8E2E1',
      },
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 5.2vw, 4.25rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.125rem, 4vw, 3.25rem)', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.75rem, 2.8vw, 2.5rem)', { lineHeight: '1.14', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.375rem, 1.9vw, 1.75rem)', { lineHeight: '1.22', letterSpacing: '-0.015em' }],
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em' }],
      },
      maxWidth: {
        content: '1200px',
        prose: '62ch',
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 35, 29, 0.04)',
        lift: '0 18px 40px -24px rgba(16, 35, 29, 0.28)',
        nav: '0 1px 0 rgba(16, 35, 29, 0.08)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
}
