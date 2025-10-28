/**
 * FILE: web/frontend/src/services/api/votes.js
 * MỤC ĐÍCH: API calls cho voting
 */

import axios from "../axios";

const votesAPI = {
  // Vote (upvote/downvote)
  vote: async (contentType, contentId, voteType) => {
    // Gửi cả hai bộ field để tương thích controller/model
    const payload = {
      contentType, // Controller validation
      contentId,
      targetType: contentType, // Model fields
      targetId: contentId,
      voteType,
    };
    const response = await axios.post("/votes", payload, {
      suppressErrorToast: true,
    });
    return response.data;
  },

  // Get vote status
  getVoteStatus: async (contentType, contentId) => {
    const response = await axios.get(`/votes/${contentType}/${contentId}`);
    return response.data;
  },

  // Get upvoters
  getUpvoters: async (contentType, contentId, params) => {
    const response = await axios.get(
      `/votes/${contentType}/${contentId}/upvotes`,
      { params }
    );
    return response.data;
  },

  // Get downvoters
  getDownvoters: async (contentType, contentId, params) => {
    const response = await axios.get(
      `/votes/${contentType}/${contentId}/downvotes`,
      { params }
    );
    return response.data;
  },
};

export default votesAPI;
