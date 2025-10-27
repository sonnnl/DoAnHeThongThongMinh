/**
 * FILE: web/frontend/src/services/api/posts.js
 * MỤC ĐÍCH: API calls cho posts
 */

import axios from "../axios";

const postsAPI = {
  // Get posts (with filters)
  getPosts: async (params) => {
    const response = await axios.get("/posts", { params });
    return response.data;
  },

  // Get post by slug
  getPost: async (slug) => {
    const response = await axios.get(`/posts/${slug}`);
    return response.data;
  },

  // Create post
  createPost: async (postData) => {
    const response = await axios.post("/posts", postData);
    return response.data;
  },

  // Update post
  updatePost: async (postId, postData) => {
    const response = await axios.put(`/posts/${postId}`, postData);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await axios.delete(`/posts/${postId}`);
    return response.data;
  },

  // Search posts
  searchPosts: async (query, params) => {
    const response = await axios.get("/posts/search", {
      params: { q: query, ...params },
    });
    return response.data;
  },

  // Get trending posts
  getTrendingPosts: async (limit = 10) => {
    const response = await axios.get("/posts/trending", { params: { limit } });
    return response.data;
  },

  // Save post
  savePost: async (postId) => {
    const response = await axios.post(`/posts/${postId}/save`);
    return response.data;
  },

  // Unsave post
  unsavePost: async (postId) => {
    const response = await axios.delete(`/posts/${postId}/save`);
    return response.data;
  },

  // Get saved posts
  getSavedPosts: async (params) => {
    const response = await axios.get("/posts/saved", { params });
    return response.data;
  },
};

export default postsAPI;
