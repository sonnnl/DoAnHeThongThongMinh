/**
 * FILE: web/frontend/src/services/api/comments.js
 * MỤC ĐÍCH: API calls cho comments
 */

import axios from "../axios";

const commentsAPI = {
  // Get comments by post
  getCommentsByPost: async (postId, params) => {
    const response = await axios.get(`/comments/post/${postId}`, { params });
    return response.data;
  },

  // Get comment
  getComment: async (commentId) => {
    const response = await axios.get(`/comments/${commentId}`);
    return response.data;
  },

  // Get replies
  getReplies: async (commentId, params) => {
    const response = await axios.get(`/comments/${commentId}/replies`, {
      params,
    });
    return response.data;
  },

  // Create comment
  createComment: async (commentData) => {
    const response = await axios.post("/comments", commentData);
    return response.data;
  },

  // Update comment
  updateComment: async (commentId, commentData) => {
    const response = await axios.put(`/comments/${commentId}`, commentData);
    return response.data;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await axios.delete(`/comments/${commentId}`);
    return response.data;
  },
};

export default commentsAPI;
