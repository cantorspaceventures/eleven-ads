/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF0F2E", // Vivid Red
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#101010", // Dark / Black
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#D7001E", // Dark Red
          foreground: "#FFFFFF",
        },
        background: "#FFFFFF",
        foreground: "#101010", // On Light text
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Inter", "sans-serif"], // Updated to geometric sans
      },
    },
  },
  plugins: [],
};
