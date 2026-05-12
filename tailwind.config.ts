import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F0D0C", // Deep Coffee Bean Brown
        foreground: "#F5F5F5", // Off-white text
        card: "#161412",
        cardBorder: "#262320",
        accent: {
          gold: "#C0A080", // Muted Gold/Brass
          brass: "#C0A080",
          brown: "#2D241E",
        },
        text: {
          primary: "#F5F5F5",
          secondary: "#C0A080",
          muted: "#8A817C",
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui"],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
