/**
 * FILE: web/frontend/src/services/axios.js
 * MỤC ĐÍCH: Axios instance với interceptors
 * LIÊN QUAN:
 *   - web/frontend/src/store/authStore.js
 *   - web/frontend/src/services/api/*.js
 */

import axios from "axios";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

// Base URL từ env hoặc default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors và refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const { refreshAccessToken } = useAuthStore.getState();
        const refreshed = await refreshAccessToken();

        if (refreshed) {
          // Retry original request with new token
          const { accessToken } = useAuthStore.getState();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const message =
      error.response?.data?.message || error.message || "Đã có lỗi xảy ra";

    // Show toast for errors (except 401 which redirects)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
