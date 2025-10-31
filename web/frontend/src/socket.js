/**
 * FILE: web/frontend/src/socket.js
 * MỤC ĐÍCH: Tạo Socket.IO client instance dùng chung
 */

import { io } from "socket.io-client";
import { useAuthStore } from "./store/authStore";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

// Khởi tạo socket (lazy connect)
const socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true,
});

// Attach auth token when connecting
export function connectSocket() {
  if (socket.connected) return socket;
  const { user } = useAuthStore.getState();
  socket.connect();
  // Identify user room
  if (user?._id) {
    socket.emit("auth:identify", user._id);
  }
  return socket;
}

export default socket;
