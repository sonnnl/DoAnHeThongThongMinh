/**
 * FILE: web/backend/routes/commentRoutes.js
 * MỤC ĐÍCH: Routes cho comments
 * LIÊN QUAN:
 *   - web/backend/controllers/commentController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, optionalAuth } = require("../middleware/auth");
const aiAnalysis = require("../middleware/aiAnalysis");
const commentController = require("../controllers/commentController");

// @route   POST /api/comments
// @desc    Tạo comment mới
// @access  Private
router.post("/", authenticate, aiAnalysis, commentController.createComment);

// @route   GET /api/comments/post/:postId
// @desc    Lấy comments của bài viết
// @access  Public
router.get("/post/:postId", optionalAuth, commentController.getCommentsByPost);

// @route   GET /api/comments/:commentId
// @desc    Lấy chi tiết comment
// @access  Public
router.get("/:commentId", optionalAuth, commentController.getComment);

// @route   GET /api/comments/:commentId/replies
// @desc    Lấy replies của comment
// @access  Public
router.get(
  "/:commentId/replies",
  optionalAuth,
  commentController.getCommentReplies
);

// @route   PUT /api/comments/:commentId
// @desc    Cập nhật comment
// @access  Private (author only)
router.put("/:commentId", authenticate, commentController.updateComment);

// @route   DELETE /api/comments/:commentId
// @desc    Xóa comment
// @access  Private (author only)
router.delete("/:commentId", authenticate, commentController.deleteComment);

module.exports = router;
