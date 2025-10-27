/**
 * FILE: web/frontend/src/store/themeStore.js
 * MỤC ĐÍCH: Zustand store cho theme (dark/light mode)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "light",

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", newTheme);
          return { theme: newTheme };
        });
      },
    }),
    {
      name: "theme-storage",
    }
  )
);
