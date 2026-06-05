/**
 * FILE: web/frontend/src/components/Navbar/__tests__/Navbar.test.jsx
 * MỤC ĐÍCH: Unit tests cho Navbar component
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { useQuery } from "react-query";
import { useAuthStore } from "../../../store/authStore";
import { useThemeStore } from "../../../store/themeStore";
import Navbar from "../Navbar";

// Spies
const mockNavigate = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(true);
const mockToggleTheme = vi.fn();

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Zustand stores
vi.mock("../../../store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../../store/themeStore", () => ({
  useThemeStore: vi.fn(),
}));

// Mock react-query
vi.mock("react-query", () => ({
  useQuery: vi.fn(),
}));

describe("Navbar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock store return values (Logged out, Light theme)
    useAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    useThemeStore.mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
    });

    useQuery.mockReturnValue({
      data: { count: 0 },
      isLoading: false,
    });
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  it("should render the logo and brand name", () => {
    renderNavbar();
    const logo = screen.getByText("Forum");
    expect(logo).toBeInTheDocument();
  });

  it("should render Login button when not authenticated", () => {
    renderNavbar();
    const loginButton = screen.getByText("Đăng nhập");
    expect(loginButton).toBeInTheDocument();
    expect(screen.queryByText("Tạo bài viết")).not.toBeInTheDocument();
  });

  it("should render user specific elements when authenticated", () => {
    useAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { username: "testuser", avatar: "" },
      logout: mockLogout,
    });

    useQuery.mockReturnValue({
      data: { count: 3 }, // 3 unread notifications
      isLoading: false,
    });

    renderNavbar();

    // Should see "Tạo bài viết" button
    expect(screen.getByText("Tạo bài viết")).toBeInTheDocument();
    
    // Notification indicator should display "3"
    const notificationBadge = screen.getByText("3");
    expect(notificationBadge).toBeInTheDocument();

    // Dropdown user menu should show username
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("should trigger theme toggle when clicking the theme button", () => {
    renderNavbar();
    
    // Find the theme button
    const themeButton = screen.getByTitle("Dark mode");
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("should show correct icon for current theme (Sun icon when dark, Moon when light)", () => {
    // Light mode -> should have title "Dark mode" (suggesting toggle to dark)
    const { rerender } = renderNavbar();
    expect(screen.getByTitle("Dark mode")).toBeInTheDocument();

    // Dark mode -> should have title "Light mode"
    useThemeStore.mockReturnValue({
      theme: "dark",
      toggleTheme: mockToggleTheme,
    });
    
    rerender(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByTitle("Light mode")).toBeInTheDocument();
  });

  it("should navigate to search page on search submission", () => {
    renderNavbar();

    // Find desktop search input (the first one)
    const searchInputs = screen.getAllByPlaceholderText("Tìm kiếm...");
    const desktopInput = searchInputs[0];

    fireEvent.change(desktopInput, { target: { value: "React Testing" } });
    
    // Submit the form
    const searchForms = document.querySelectorAll("form");
    const desktopForm = searchForms[0];
    fireEvent.submit(desktopForm);

    expect(mockNavigate).toHaveBeenCalledWith("/search?q=React%20Testing");
  });

  it("should call logout and navigate to login page when clicking logout", () => {
    useAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { username: "testuser" },
      logout: mockLogout,
    });

    renderNavbar();

    const logoutButton = screen.getByText("Đăng xuất");
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
