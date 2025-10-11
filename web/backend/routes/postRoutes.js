/**
 * FILE: web/backend/routes/postRoutes.js
 * MỤC ĐÍCH: Routes cho posts
 * LIÊN QUAN:
 *   - web/backend/controllers/postController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, canPost, optionalAuth } = require("../middleware/auth");
const {
  validateCreatePost,
  validateUpdatePost,
  validateMongoId,
  validatePagination,
} = require("../middleware/validate");

// @route   GET /api/posts
// @desc    Lấy danh sách posts (hot, new, top)
// @access  Public
router.get("/", validatePagination, (req, res) => {
  res.json({ message: "Get posts - TODO" });
});

// @route   GET /api/posts/:slug
// @desc    Lấy chi tiết post
// @access  Public (with optional auth for vote status)
router.get("/:slug", optionalAuth, (req, res) => {
  res.json({ message: "Get post detail - TODO" });
});

// @route   POST /api/posts
// @desc    Tạo post mới
// @access  Private (requires canPost)
router.post("/", authenticate, canPost, validateCreatePost, (req, res) => {
  res.json({ message: "Create post - TODO" });
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (author only)
router.put(
  "/:id",
  authenticate,
  validateMongoId("id"),
  validateUpdatePost,
  (req, res) => {
    res.json({ message: "Update post - TODO" });
  }
);

// @route   DELETE /api/posts/:id
// @desc    Xóa post
// @access  Private (author only)
router.delete("/:id", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Delete post - TODO" });
});

module.exports = router;
