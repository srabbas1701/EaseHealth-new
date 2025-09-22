/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom theme colors using CSS variables
        'theme-primary': 'var(--color-primary)',
        'theme-primary-dark': 'var(--color-primary-dark)',
        'theme-accent': 'var(--color-accent)',
        'theme-background': 'var(--color-background)',
        'theme-background-secondary': 'var(--color-background-secondary)',
        'theme-surface': 'var(--color-surface)',
        'theme-border': 'var(--color-border)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-text-muted': 'var(--color-text-muted)',
        'theme-success': 'var(--color-success)',
        'theme-warning': 'var(--color-warning)',
        'theme-error': 'var(--color-error)',
      },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-xl': 'var(--shadow-xl)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
