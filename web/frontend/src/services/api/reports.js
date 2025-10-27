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
  reviewReport: async (reportId, action, reviewNote) => {
    const response = await axios.put(`/reports/${reportId}`, {
      action,
      reviewNote,
    });
    return response.data;
  },

  // Get report stats (Moderator/Admin)
  getReportStats: async () => {
    const response = await axios.get("/reports/stats");
    return response.data;
  },
};

export default reportsAPI;
