/**
 * FILE: web/frontend/src/services/api/categories.js
 * MỤC ĐÍCH: API calls cho categories
 */

import axios from "../axios";

const categoriesAPI = {
  // Get all categories
  getCategories: async (params) => {
    const response = await axios.get("/categories", { params });
    return response;
  },

  // Get category by slug
  getCategory: async (slug) => {
    const response = await axios.get(`/categories/${slug}`);
    return response.data?.data || response.data || response; // tolerate both
  },

  // Get trending categories
  getTrendingCategories: async (limit = 10) => {
    const response = await axios.get("/categories/trending", {
      params: { limit },
    });
    return response;
  },

  // Get following categories
  getFollowingCategories: async () => {
    const response = await axios.get("/categories/following");
    return response;
  },

  // Follow category
  followCategory: async (categoryId) => {
    const response = await axios.post(`/categories/${categoryId}/follow`);
    return response;
  },

  // Unfollow category
  unfollowCategory: async (categoryId) => {
    const response = await axios.delete(`/categories/${categoryId}/follow`);
    return response;
  },

  // Create category (Admin)
  createCategory: async (categoryData) => {
    const response = await axios.post("/categories", categoryData);
    return response;
  },

  // Update category (Admin)
  updateCategory: async (categoryId, categoryData) => {
    const response = await axios.put(`/categories/${categoryId}`, categoryData);
    return response;
  },

  // Delete category (Admin)
  deleteCategory: async (categoryId) => {
    const response = await axios.delete(`/categories/${categoryId}`);
    return response;
  },
};

export default categoriesAPI;
