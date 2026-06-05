/**
 * FILE: web/frontend/src/store/__tests__/authStore.test.js
 * MỤC ĐÍCH: Unit tests cho authStore (Zustand)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../authStore";
import authAPI from "../../services/api/auth";

// Mock the authAPI service
vi.mock("../../services/api/auth", () => {
  return {
    default: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
      googleAuth: vi.fn(),
    },
  };
});

describe("authStore (Zustand)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.clear();
  });

  it("should have correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("should set authentication details on setAuth", () => {
    const mockData = {
      user: { id: 1, username: "testuser" },
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
    };

    const { setAuth } = useAuthStore.getState();
    
    setAuth(mockData);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockData.user);
    expect(state.accessToken).toBe(mockData.accessToken);
    expect(state.refreshToken).toBe(mockData.refreshToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it("should set user profile details on setUser", () => {
    const mockUser = { id: 1, username: "updateduser" };
    const { setUser } = useAuthStore.getState();

    setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
  });

  it("should clear authentication state on clearAuth", () => {
    // Set some state first
    useAuthStore.setState({
      user: { id: 1 },
      accessToken: "token",
      refreshToken: "token",
      isAuthenticated: true,
    });

    const { clearAuth } = useAuthStore.getState();
    clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  describe("login action", () => {
    it("should login successfully and set authentication state", async () => {
      const mockResponse = {
        user: { id: 1, username: "testuser" },
        accessToken: "access-123",
        refreshToken: "refresh-456",
      };
      
      authAPI.login.mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().login({ username: "test", password: "pwd" });

      expect(authAPI.login).toHaveBeenCalledWith({ username: "test", password: "pwd" });
      expect(result.success).toBe(true);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("should fail to login and capture error message", async () => {
      authAPI.login.mockRejectedValue(new Error("Invalid credentials"));

      const result = await useAuthStore.getState().login({ username: "test", password: "pwd" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("register action", () => {
    it("should register successfully and set authentication state", async () => {
      const mockResponse = {
        user: { id: 1, username: "newuser" },
        accessToken: "access-123",
        refreshToken: "refresh-456",
      };
      
      authAPI.register.mockResolvedValue(mockResponse);

      const result = await useAuthStore.getState().register({ username: "new", email: "a@b.com", password: "pwd" });

      expect(authAPI.register).toHaveBeenCalledWith({ username: "new", email: "a@b.com", password: "pwd" });
      expect(result.success).toBe(true);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe("logout action", () => {
    it("should call authAPI.logout and clear authentication details", async () => {
      useAuthStore.setState({
        user: { id: 1 },
        accessToken: "token",
        isAuthenticated: true,
      });

      authAPI.logout.mockResolvedValue({});

      await useAuthStore.getState().logout();

      expect(authAPI.logout).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("initializeAuth action", () => {
    it("should initialize state from localStorage if token exists", () => {
      const mockStoreData = {
        state: {
          user: { username: "storeduser" },
          accessToken: "stored-token",
          refreshToken: "stored-refresh",
        },
        version: 0,
      };
      localStorage.setItem("auth-storage", JSON.stringify(mockStoreData));

      useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockStoreData.state.user);
      expect(state.accessToken).toBe(mockStoreData.state.accessToken);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe("googleLogin action", () => {
    it("should authenticate with Google API and set state", async () => {
      const mockResponse = {
        user: { id: 2, username: "googleuser" },
        accessToken: "g-access-token",
        refreshToken: "g-refresh-token",
      };
      authAPI.googleAuth.mockResolvedValue(mockResponse);

      const googleData = { token: "google-jwt-token", email: "test@google.com" };
      const result = await useAuthStore.getState().googleLogin(googleData);

      expect(authAPI.googleAuth).toHaveBeenCalledWith(googleData);
      expect(result.success).toBe(true);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockResponse.user);
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
