/**
 * FILE: web/frontend/src/services/api/users.js
 * MỤC ĐÍCH: API calls cho users
 * LƯU Ý: Axios interceptor đã unwrap response.data một lần,
 *        các methods này unwrap thêm lần nữa để trả về data trực tiếp
 */

import axios from "../axios";

const usersAPI = {
  // Get user profile
  getUserProfile: async (username) => {
    const response = await axios.get(`/users/${username}`);
    return response.data; // Unwrap để lấy user object
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await axios.put("/users/profile", profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await axios.put("/users/change-password", passwordData);
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    const response = await axios.put("/users/preferences", preferences);
    return response.data;
  },

  // Follow user
  followUser: async (userId) => {
    const response = await axios.post(`/users/${userId}/follow`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const response = await axios.delete(`/users/${userId}/follow`);
    return response.data;
  },

  // Get followers
  getFollowers: async (userId, params) => {
    const response = await axios.get(`/users/${userId}/followers`, { params });
    return response.data;
  },

  // Get following
  getFollowing: async (userId, params) => {
    const response = await axios.get(`/users/${userId}/following`, { params });
    return response.data;
  },

  // Block user
  blockUser: async (userId) => {
    const response = await axios.post(`/users/${userId}/block`);
    return response.data;
  },

  // Unblock user
  unblockUser: async (userId) => {
    const response = await axios.delete(`/users/${userId}/block`);
    return response.data;
  },

  // Get user posts
  getUserPosts: async (userId, params) => {
    const response = await axios.get(`/users/${userId}/posts`, { params });
    return response.data;
  },

  // Get user comments
  getUserComments: async (userId, params) => {
    const response = await axios.get(`/users/${userId}/comments`, { params });
    return response.data;
  },

  // Search users
  searchUsers: async (query, params) => {
    const response = await axios.get("/users/search", {
      params: { q: query, ...params },
    });
    return response.data;
  },
};

export default usersAPI;
