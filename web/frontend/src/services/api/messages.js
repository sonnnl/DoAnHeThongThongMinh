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
  getOrCreateConversation: async (userId) => {
    const response = await axios.get(`/messages/conversations/${userId}`);
    return response.data;
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
};

export default messagesAPI;
