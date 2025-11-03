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

// Trạng thái cục bộ để tránh lặp lại xử lý khi bị ban
let isHandlingBan = false;

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

    // Handle 403 Forbidden - banned user
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || "";
      const reason = error.response?.data?.reason || "";
      const bannedUntil = error.response?.data?.bannedUntil
        ? new Date(error.response.data.bannedUntil)
        : null;

      if (
        !isHandlingBan &&
        (message.toLowerCase().includes("banned") || reason || bannedUntil)
      ) {
        isHandlingBan = true;
        const { clearAuth } = useAuthStore.getState();
        clearAuth();

        // Tính thời gian còn lại
        let remainStr = "";
        if (bannedUntil) {
          const ms = bannedUntil.getTime() - Date.now();
          if (ms > 0) {
            const days = Math.floor(ms / (24 * 60 * 60 * 1000));
            const hours = Math.floor(
              (ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
            );
            const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
            if (days > 0) remainStr = `${days} ngày ${hours} giờ`;
            else if (hours > 0) remainStr = `${hours} giờ ${minutes} phút`;
            else remainStr = `${minutes} phút`;
          }
        }

        const banMsg = bannedUntil
          ? `Tài khoản bị hạn chế đến ${bannedUntil.toLocaleString("vi-VN")}${
              remainStr ? ` (còn ${remainStr})` : ""
            }${reason ? `. Lý do: ${reason}` : ""}`
          : reason
          ? `Tài khoản bị hạn chế: ${reason}`
          : "Tài khoản của bạn đang bị hạn chế quyền truy cập";

        // Hiện toast nhưng KHÔNG reload trang, điều hướng mềm ở App qua custom event
        toast.error(banMsg);
        // Dập tắt toast lỗi mặc định cho request này
        if (originalRequest) originalRequest.suppressErrorToast = true;

        window.dispatchEvent(
          new CustomEvent("auth:banned", {
            detail: { reason, message: banMsg, bannedUntil },
          })
        );
        // Reset cờ sau một chút để tránh chặn toàn bộ request sau đó
        setTimeout(() => {
          isHandlingBan = false;
        }, 1500);
        return Promise.reject(error);
      }
    }

    // Handle other errors
    const message =
      error.response?.data?.message || error.message || "Đã có lỗi xảy ra";

    // Cho phép tắt toast ở từng request
    const suppress = originalRequest?.suppressErrorToast === true;

    // Show toast for errors (except 401 which redirects, and 403 which ta tự xử lý)
    if (
      error.response?.status !== 401 &&
      error.response?.status !== 403 &&
      !suppress
    ) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
