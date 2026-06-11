export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#C9A96E',
        ink: '#1A1A1A',
        muted: '#8B8B8B',
        line: '#E8E2D9',
        surface: '#FAF8F5',
        accent: '#F5EFE6',
      },
      boxShadow: {
        soft: '0 24px 60px rgba(0,0,0,0.08)',
        card: '0 18px 40px rgba(0,0,0,0.05)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
