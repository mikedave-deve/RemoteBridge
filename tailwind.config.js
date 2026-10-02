/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bridge: {
          50: '#EEF6F7',
          100: '#D6EAED',
          200: '#AFD5DB',
          300: '#7FB9C3',
          400: '#4C99A7',
          500: '#1F7A8C', // brand
          600: '#196676',
          700: '#145361',
          800: '#0F424D',
          900: '#0B3640',
          950: '#06242B',
        },
        ink: '#14282E',
        slate: { DEFAULT: '#4A6066', soft: '#6B8086' },
        mist: '#EDF3F3',
        paper: '#F8FAFA',
        line: '#D7E2E3',
      },
      fontFamily: {
        display: ['"Newsreader Variable"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk Variable"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { frame: '1680px' },
      letterSpacing: { tightest: '-0.035em' },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
}
