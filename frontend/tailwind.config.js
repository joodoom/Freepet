/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        green: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      boxShadow: {
        'neon-violet': '0 4px 24px rgba(249, 115, 22, 0.35)',
        'neon-emerald': '0 4px 24px rgba(16, 185, 129, 0.35)',
        'neon-violet-lg': '0 8px 40px rgba(249, 115, 22, 0.25)',
        'neon-emerald-lg': '0 8px 40px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [],
};
