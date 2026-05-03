/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#185FA5',
          50: '#EBF2FA',
          100: '#D4E2F2',
          200: '#A9C5E5',
          300: '#7DA8D8',
          400: '#528BCB',
          500: '#185FA5',
          600: '#134C84',
          700: '#0E3963',
          800: '#0A2642',
          900: '#051321',
        },
        score: {
          bad: '#C0392B',
          neutral: '#9CA3AF',
          good: '#1F8A4C',
        },
        ink: '#0F172A',
        muted: '#64748B',
        line: '#E2E8F0',
        bg: '#F7F9FC',
      },
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
