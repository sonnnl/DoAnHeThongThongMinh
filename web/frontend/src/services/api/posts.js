/**
 * FILE: web/frontend/src/services/api/posts.js
 * MỤC ĐÍCH: API calls cho posts
 */

import axios from "../axios";

const postsAPI = {
  // Get posts (with filters)
  getPosts: async (params) => {
    const response = await axios.get("/posts", { params });
    return response;
  },

  // Get post by slug
  getPost: async (slug) => {
    const response = await axios.get(`/posts/${slug}`);
    return response;
  },

  // Get post by id
  getPostById: async (postId) => {
    const response = await axios.get(`/posts/id/${postId}`);
    return response;
  },

  // Create post
  createPost: async (postData) => {
    const response = await axios.post("/posts", postData);
    return response;
  },

  // Update post
  updatePost: async (postId, postData) => {
    const response = await axios.put(`/posts/${postId}`, postData);
    return response;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await axios.delete(`/posts/${postId}`);
    return response;
  },

  // Search posts
  searchPosts: async (query, params) => {
    const response = await axios.get("/posts/search", {
      params: { q: query, ...params },
    });
    return response;
  },

  // Get trending posts
  getTrendingPosts: async (limit = 10) => {
    const response = await axios.get("/posts/trending", { params: { limit } });
    return response;
  },

  // Save post
  savePost: async (postId) => {
    const response = await axios.post(`/posts/${postId}/save`);
    return response;
  },

  // Unsave post
  unsavePost: async (postId) => {
    const response = await axios.delete(`/posts/${postId}/save`);
    return response;
  },

  // Get saved posts
  getSavedPosts: async (params) => {
    const response = await axios.get("/posts/saved", { params });
    return response;
  },
};

export default postsAPI;
