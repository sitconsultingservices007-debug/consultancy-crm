export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: '#2563EB', success: '#10B981', accent: '#7C3AED',
        warn: '#F59E0B', danger: '#EF4444', ink: '#0F172A', canvas: '#F6F7FB',
      },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.05)' },
    },
  },
  plugins: [],
}
