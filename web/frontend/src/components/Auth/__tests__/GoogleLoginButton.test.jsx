/**
 * FILE: web/frontend/src/components/Auth/__tests__/GoogleLoginButton.test.jsx
 * MỤC ĐÍCH: Unit tests cho GoogleLoginButton component
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GoogleLoginButton from "../GoogleLoginButton";
import { useAuthStore } from "../../../store/authStore";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// Spies
const mockNavigate = vi.fn();
const mockGoogleLogin = vi.fn();

// Mock dependencies
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../store/authStore", () => ({
  useAuthStore: () => ({
    googleLogin: mockGoogleLogin,
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

// Mock GoogleLogin component from @react-oauth/google
vi.mock("@react-oauth/google", () => {
  return {
    GoogleLogin: ({ onSuccess, onError }) => (
      <div>
        <button
          data-testid="google-mock-success"
          onClick={() => onSuccess({ credential: "mock-google-jwt-token" })}
        >
          Google Success
        </button>
        <button
          data-testid="google-mock-error"
          onClick={() => onError()}
        >
          Google Error
        </button>
      </div>
    ),
  };
});

describe("GoogleLoginButton Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render mock Google login button options", () => {
    render(<GoogleLoginButton />);
    expect(screen.getByTestId("google-mock-success")).toBeInTheDocument();
    expect(screen.getByTestId("google-mock-error")).toBeInTheDocument();
  });

  it("should handle successful Google authentication", async () => {
    const mockDecodedToken = {
      email: "test@gmail.com",
      name: "Google User",
      picture: "https://avatar.url",
      sub: "google-uid-123",
    };
    
    jwtDecode.mockReturnValue(mockDecodedToken);
    mockGoogleLogin.mockResolvedValue({ success: true });

    render(<GoogleLoginButton />);

    // Trigger success button callback
    fireEvent.click(screen.getByTestId("google-mock-success"));

    // Verify jwt decoding
    expect(jwtDecode).toHaveBeenCalledWith("mock-google-jwt-token");

    // Verify api authentication call
    expect(mockGoogleLogin).toHaveBeenCalledWith({
      token: "mock-google-jwt-token",
      email: mockDecodedToken.email,
      name: mockDecodedToken.name,
      picture: mockDecodedToken.picture,
      googleId: mockDecodedToken.sub,
    });

    // Wait for async operations
    await vi.waitFor(() => {
      // Verify toast message and navigation
      expect(toast.success).toHaveBeenCalledWith("Đăng nhập Google thành công!");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should show error toast when backend authentication fails", async () => {
    const mockDecodedToken = {
      email: "test@gmail.com",
      name: "Google User",
      picture: "https://avatar.url",
      sub: "google-uid-123",
    };
    
    jwtDecode.mockReturnValue(mockDecodedToken);
    mockGoogleLogin.mockResolvedValue({ success: false, error: "Tài khoản bị khóa" });

    render(<GoogleLoginButton />);

    fireEvent.click(screen.getByTestId("google-mock-success"));

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Tài khoản bị khóa");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("should show error toast when Google login errors directly", async () => {
    render(<GoogleLoginButton />);

    fireEvent.click(screen.getByTestId("google-mock-error"));

    expect(toast.error).toHaveBeenCalledWith("Đăng nhập Google thất bại");
    expect(mockGoogleLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
