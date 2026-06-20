/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        heading: ['var(--font-heading)'],
        body: ['var(--font-body)'],
      },
      colors: {
        background: 'var(--bg-color)',
        surface: 'var(--surface-color)',
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        text: 'var(--text-color)',
        muted: 'var(--muted-color)',
        glow: 'var(--glow-color)',
      },
      boxShadow: {
        'glow': '0 0 20px var(--glow-color)',
        'glow-lg': '0 0 40px var(--glow-color)',
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { opacity: 0.5, transform: 'scale(1)' },
          '100%': { opacity: 1, transform: 'scale(1.05)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}
