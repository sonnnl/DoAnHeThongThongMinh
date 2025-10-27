/**
 * FILE: web/frontend/src/services/api/auth.js
 * MỤC ĐÍCH: API calls cho authentication
 * LƯU Ý: Axios interceptor đã unwrap response.data một lần,
 *        các methods này unwrap thêm lần nữa để trả về data trực tiếp
 */

import axios from "../axios";

const authAPI = {
  // Register
  register: async (userData) => {
    const response = await axios.post("/auth/register", userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await axios.post("/auth/login", credentials);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await axios.post("/auth/logout");
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axios.get("/auth/me");
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await axios.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  // Google OAuth
  googleAuth: async (googleData) => {
    const response = await axios.post("/auth/google", googleData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await axios.post("/auth/forgot-password", { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await axios.post(`/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await axios.get(`/auth/verify/${token}`);
    return response.data;
  },
};

export default authAPI;
