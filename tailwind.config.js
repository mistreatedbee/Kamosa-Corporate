export default {
  content: ['./**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#10231D',
          900: '#10231D',
          800: '#163027',
          700: '#1B4235',
        },
        brand: {
          DEFAULT: '#176B4B',
          600: '#176B4B',
          500: '#239064',
        },
        gold: {
          DEFAULT: '#C8A45A',
          soft: '#DCC48F',
        },
        cream: '#F5F3ED',
        muted: '#64706B',
        hairline: '#E3E6E1',
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
        content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
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
