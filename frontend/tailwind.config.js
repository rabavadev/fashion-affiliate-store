/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./tests/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAFA',
        card: '#F3F1EC',
        charcoal: '#111111',
        muted: '#767676',
        hairline: '#E5E5E5',
        accentRed: '#C93B2B',
      },
      letterSpacing: {
        widest: '0.2em',
        editorial: '0.25em',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Didot', 'Bodoni MT', 'Cinzel', 'Playfair Display', 'serif'],
      },
      aspectRatio: {
        '3/4': '3 / 4',
      },
    },
  },
  plugins: [],
};
