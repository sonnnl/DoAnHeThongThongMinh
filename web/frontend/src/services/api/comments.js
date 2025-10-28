/**
 * FILE: web/frontend/src/services/api/comments.js
 * MỤC ĐÍCH: API calls cho comments
 */

import axios from "../axios";

const commentsAPI = {
  // Get comments by post
  getCommentsByPost: async (postId, params) => {
    const response = await axios.get(`/comments/post/${postId}`, { params });
    return response;
  },

  // Get comment
  getComment: async (commentId) => {
    const response = await axios.get(`/comments/${commentId}`);
    return response;
  },

  // Get replies
  getReplies: async (commentId, params) => {
    const response = await axios.get(`/comments/${commentId}/replies`, {
      params,
    });
    return response;
  },

  // Create comment
  createComment: async (commentData) => {
    const payload = {
      ...commentData,
      postId: commentData.postId || commentData.post, // Chuẩn hóa field
    };
    delete payload.post;
    const response = await axios.post("/comments", payload);
    return response;
  },

  // Update comment
  updateComment: async (commentId, commentData) => {
    const response = await axios.put(`/comments/${commentId}`, commentData);
    return response;
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await axios.delete(`/comments/${commentId}`);
    return response;
  },
};

export default commentsAPI;
