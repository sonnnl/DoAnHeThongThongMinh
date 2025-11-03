/**
 * FILE: web/frontend/src/services/api/reports.js
 * MỤC ĐÍCH: API calls cho reports
 */

import axios from "../axios";

const reportsAPI = {
  // Create report
  createReport: async (reportData) => {
    const response = await axios.post("/reports", reportData);
    return response.data;
  },

  // Get my reports
  getMyReports: async (params) => {
    const response = await axios.get("/reports/my-reports", { params });
    return response.data;
  },

  // Get reports (Moderator/Admin)
  getReports: async (params) => {
    const response = await axios.get("/reports", { params });
    return response.data;
  },

  // Get report detail (Moderator/Admin)
  getReport: async (reportId) => {
    const response = await axios.get(`/reports/${reportId}`);
    return response.data;
  },

  // Review report (Moderator/Admin)
  reviewReport: async (reportId, action, reviewNote, moderationAction) => {
    const body = { action, reviewNote };
    if (moderationAction) body.moderationAction = moderationAction;
    const response = await axios.put(`/reports/${reportId}`, body);
    return response.data;
  },

  // Get report stats (Moderator/Admin)
  getReportStats: async (params) => {
    const response = await axios.get("/reports/stats", { params });
    return response.data;
  },
};

export default reportsAPI;
