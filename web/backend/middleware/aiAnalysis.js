/**
 * FILE: web/backend/middleware/aiAnalysis.js
 * MỤC ĐÍCH: Middleware phân tích nội dung bằng AI trước khi lưu vào DB
 * LIÊN QUAN:
 *   - web/backend/utils/aiClient.js
 *   - web/backend/controllers/postController.js
 *   - web/backend/controllers/commentController.js
 * CHỨC NĂNG:
 *   - Gọi AI client để phân tích text
 *   - Attach kết quả vào req.aiAnalysis
 *   - Cho phép request tiếp tục dù AI lỗi (graceful fallback)
 */

const aiClient = require("../utils/aiClient");

/**
 * Middleware phân tích nội dung bằng AI
 * Sử dụng: router.post('/', authenticate, aiAnalysis, createPost);
 */
const aiAnalysis = async (req, res, next) => {
  try {
    // Lấy text từ body (có thể là title + content cho post, hoặc content cho comment)
    let textToAnalyze = "";

    if (req.body.title && req.body.content) {
      // Post: analyze cả title và content
      textToAnalyze = `${req.body.title} ${req.body.content}`;
    } else if (req.body.content) {
      // Comment: chỉ analyze content
      textToAnalyze = req.body.content;
    } else {
      // Không có text để phân tích
      return next();
    }

    // Gọi AI service
    const aiResult = await aiClient.analyzeText(textToAnalyze);

    if (aiResult) {
      // Attach kết quả vào request để controller sử dụng
      req.aiAnalysis = {
        isToxic: aiResult.isToxic || false,
        toxicScore: aiResult.toxicScore || 0,
        toxicType: aiResult.toxicType || "clean",
        emotion: aiResult.emotion || "neutral",
        emotionScore: aiResult.emotionScore || 0,
        analyzedAt: new Date(),
      };
    } else {
      // Fallback: nếu AI lỗi, set default values
      req.aiAnalysis = {
        isToxic: false,
        toxicScore: 0,
        toxicType: "clean",
        emotion: "neutral",
        emotionScore: 0,
        analyzedAt: null,
      };
    }
  } catch (error) {
    console.error("❌ Error in AI analysis middleware:", error);
    // Không throw error, chỉ log và tiếp tục
    req.aiAnalysis = {
      isToxic: false,
      toxicScore: 0,
      toxicType: "clean",
      emotion: "neutral",
      emotionScore: 0,
      analyzedAt: null,
    };
  }

  // Tiếp tục request dù AI có lỗi hay không
  next();
};

module.exports = aiAnalysis;
