/**
 * FILE: web/backend/utils/aiClient.js
 * MỤC ĐÍCH: HTTP Client gọi AI Service để phân tích nội dung
 * LIÊN QUAN:
 *   - ai/api.py (AI Service)
 *   - web/backend/middleware/aiAnalysis.js
 * CHỨC NĂNG:
 *   - Gọi AI service để phân tích toxic và emotion
 *   - Handle timeout và errors
 *   - Graceful fallback nếu AI service down
 */

const axios = require("axios");

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:6000";

// Timeout cho AI requests (milliseconds)
const AI_TIMEOUT = 5000; // 5 giây

/**
 * Gọi AI service để phân tích text
 * @param {string} text - Text cần phân tích
 * @returns {Promise<Object>} - Kết quả phân tích
 */
async function analyzeText(text) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/analyze`,
      { text },
      {
        timeout: AI_TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      console.error(
        "❌ AI Service returned unsuccessful response:",
        response.data
      );
      return null;
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.warn(
        "⚠️  AI Service is not running (connection refused). Skipping AI analysis."
      );
    } else if (error.code === "ETIMEDOUT") {
      console.warn("⚠️  AI Service timeout. Skipping AI analysis.");
    } else {
      console.error("❌ Error calling AI Service:", error.message);
    }
    return null;
  }
}

/**
 * Health check AI service
 * @returns {Promise<boolean>} - True nếu AI service đang chạy
 */
async function checkAIHealth() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/ai/health`, {
      timeout: 3000,
    });
    return response.data && response.data.success;
  } catch (error) {
    return false;
  }
}

module.exports = {
  analyzeText,
  checkAIHealth,
};
