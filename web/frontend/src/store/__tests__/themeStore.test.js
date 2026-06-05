/**
 * FILE: web/frontend/src/store/__tests__/themeStore.test.js
 * MỤC ĐÍCH: Unit tests cho themeStore (Zustand state store)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "../themeStore";

describe("themeStore (Zustand)", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useThemeStore.setState({ theme: "light" });
    document.documentElement.removeAttribute("data-theme");
  });

  it("should have initial theme state of light", () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe("light");
  });

  it("should update theme and set document attribute on setTheme", () => {
    const { setTheme } = useThemeStore.getState();
    
    // Set to dark mode
    setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Set back to light mode
    setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("should toggle theme correctly on toggleTheme", () => {
    const { toggleTheme } = useThemeStore.getState();
    
    // Toggle once (light -> dark)
    toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Toggle twice (dark -> light)
    toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
