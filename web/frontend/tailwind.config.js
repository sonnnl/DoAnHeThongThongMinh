/**
 * FILE: web/frontend/tailwind.config.js
 * MỤC ĐÍCH: Cấu hình TailwindCSS và DaisyUI
 */

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        accent: "#f59e0b",
        neutral: "#3d4451",
        "base-100": "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#3b82f6",
          secondary: "#8b5cf6",
          accent: "#f59e0b",
          neutral: "#3d4451",
          "base-100": "#ffffff",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        dark: {
          primary: "#3b82f6",
          secondary: "#8b5cf6",
          accent: "#f59e0b",
          neutral: "#2a2e37",
          "base-100": "#1d232a",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
  },
};
