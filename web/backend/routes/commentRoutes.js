/**
 * FILE: web/backend/routes/commentRoutes.js
 * MỤC ĐÍCH: Routes cho comments
 * LIÊN QUAN:
 *   - web/backend/controllers/commentController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const {
  authenticate,
  canComment,
  optionalAuth,
} = require("../middleware/auth");
const {
  validateCreateComment,
  validateMongoId,
  validatePagination,
} = require("../middleware/validate");

// @route   GET /api/comments
// @desc    Lấy comments của post
// @access  Public
router.get("/", validatePagination, optionalAuth, (req, res) => {
  res.json({ message: "Get comments - TODO" });
});

// @route   GET /api/comments/:id
// @desc    Lấy chi tiết comment
// @access  Public
router.get("/:id", validateMongoId("id"), optionalAuth, (req, res) => {
  res.json({ message: "Get comment - TODO" });
});

// @route   POST /api/comments
// @desc    Tạo comment mới
// @access  Private (requires canComment)
router.post(
  "/",
  authenticate,
  canComment,
  validateCreateComment,
  (req, res) => {
    res.json({ message: "Create comment - TODO" });
  }
);

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (author only)
router.put("/:id", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Update comment - TODO" });
});

// @route   DELETE /api/comments/:id
// @desc    Xóa comment
// @access  Private (author only)
router.delete("/:id", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Delete comment - TODO" });
});

module.exports = router;
