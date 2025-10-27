/**
 * FILE: web/frontend/src/store/authStore.js
 * MỤC ĐÍCH: Zustand store cho authentication state
 * LIÊN QUAN:
 *   - web/frontend/src/services/api/auth.js
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import authAPI from "../services/api/auth";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (data) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("auth-storage");
      },

      // Login
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const data = await authAPI.login(credentials);
          get().setAuth(data);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true });
        try {
          const data = await authAPI.register(userData);
          get().setAuth(data);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },

      // Logout
      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          get().clearAuth();
        }
      },

      // Refresh token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const data = await authAPI.refreshToken(refreshToken);
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          return true;
        } catch (error) {
          get().clearAuth();
          return false;
        }
      },

      // Get current user
      fetchCurrentUser: async () => {
        try {
          const user = await authAPI.getCurrentUser();
          set({ user });
          return user;
        } catch (error) {
          console.error("Fetch user error:", error);
          return null;
        }
      },

      // Initialize auth from localStorage
      initializeAuth: () => {
        const storedState = localStorage.getItem("auth-storage");
        if (storedState) {
          const { state } = JSON.parse(storedState);
          if (state.accessToken) {
            set({
              user: state.user,
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
              isAuthenticated: true,
            });
          }
        }
      },

      // Google OAuth
      googleLogin: async (googleData) => {
        set({ isLoading: true });
        try {
          const data = await authAPI.googleAuth(googleData);
          console.log("🔐 Backend response from googleAuth:", data);
          console.log("🔐 data.user:", data.user);
          console.log("🔐 data.accessToken:", data.accessToken);

          get().setAuth(data);

          // Verify state sau khi set
          const currentState = get();
          console.log("🔐 Auth state after setAuth:", {
            user: currentState.user,
            isAuthenticated: currentState.isAuthenticated,
          });

          return { success: true };
        } catch (error) {
          console.error("❌ Google login error:", error);
          return { success: false, error: error.message };
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
