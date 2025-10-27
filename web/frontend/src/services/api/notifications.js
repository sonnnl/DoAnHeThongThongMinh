/**
 * FILE: web/frontend/src/services/api/notifications.js
 * MỤC ĐÍCH: API calls cho notifications
 */

import axios from "../axios";

const notificationsAPI = {
  // Get notifications
  getNotifications: async (params) => {
    const response = await axios.get("/notifications", { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await axios.get("/notifications/unread-count");
    return response.data;
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    const response = await axios.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await axios.put("/notifications/read-all");
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await axios.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await axios.delete("/notifications");
    return response.data;
  },
};

export default notificationsAPI;
