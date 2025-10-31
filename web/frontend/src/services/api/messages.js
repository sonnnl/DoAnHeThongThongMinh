/**
 * FILE: web/frontend/src/services/api/messages.js
 * MỤC ĐÍCH: API calls cho direct messages
 */

import axios from "../axios";

const messagesAPI = {
  // Get conversations
  getConversations: async (params) => {
    const response = await axios.get("/messages/conversations", { params });
    return response.data;
  },

  // Get or create conversation
  // LƯU Ý: Axios interceptor đã unwrap response.data một lần,
  //        nên response = { success, data } (structure từ backend)
  //        Không cần unwrap thêm vì Profile.jsx cần dùng response.data
  getOrCreateConversation: async (userId) => {
    const response = await axios.get(`/messages/conversations/${userId}`);
    // Response = { success: true, data: conversation }
    return response;
  },

  // Get messages
  getMessages: async (conversationId, params) => {
    const response = await axios.get(
      `/messages/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data;
  },

  // Send message
  sendMessage: async (messageData) => {
    const response = await axios.post("/messages", messageData);
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await axios.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await axios.get("/messages/unread-count");
    return response.data;
  },

  // Create group conversation
  createGroupConversation: async (data) => {
    const response = await axios.post("/messages/conversations/group", data);
    return response.data;
  },

  // Add participant to group
  addParticipant: async (conversationId, userId) => {
    const response = await axios.post(
      `/messages/conversations/${conversationId}/participants`,
      { userId }
    );
    return response.data;
  },

  // Remove participant from group
  removeParticipant: async (conversationId, userId) => {
    const response = await axios.delete(
      `/messages/conversations/${conversationId}/participants/${userId}`
    );
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    const response = await axios.put(
      `/messages/conversations/${conversationId}/mark-read`
    );
    return response.data;
  },
};

export default messagesAPI;
