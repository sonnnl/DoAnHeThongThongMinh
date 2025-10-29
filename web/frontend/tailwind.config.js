/**
 * FILE: web/frontend/tailwind.config.js
 * MỤC ĐÍCH: Cấu hình TailwindCSS và DaisyUI
 */

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#f97316", // orange-500
        secondary: "#6366f1", // indigo-500
        accent: "#0ea5a1", // teal-500-ish
        neutral: "#3d4451",
        "base-100": "#faf7f2", // warm off-white
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
          primary: "#f97316",
          secondary: "#6366f1",
          accent: "#0ea5a1",
          neutral: "#3d4451",
          "base-100": "#faf7f2",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        dark: {
          primary: "#f97316",
          secondary: "#6366f1",
          accent: "#0ea5a1",
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
