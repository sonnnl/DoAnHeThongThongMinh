/**
 * FILE: web/backend/routes/userRoutes.js
 * MỤC ĐÍCH: Routes cho user management
 * LIÊN QUAN:
 *   - web/backend/controllers/userController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, isAdmin } = require("../middleware/auth");
const {
  validateMongoId,
  validatePagination,
} = require("../middleware/validate");

// @route   GET /api/users
// @desc    Lấy danh sách users (admin)
// @access  Private (Admin)
router.get("/", authenticate, isAdmin, validatePagination, (req, res) => {
  res.json({ message: "Get users - TODO" });
});

// @route   GET /api/users/:id
// @desc    Lấy profile user
// @access  Public
router.get("/:id", validateMongoId("id"), (req, res) => {
  res.json({ message: "Get user profile - TODO" });
});

// @route   PUT /api/users/:id
// @desc    Update profile
// @access  Private (Own profile only)
router.put("/:id", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Update profile - TODO" });
});

// @route   POST /api/users/:id/avatar
// @desc    Upload avatar
// @access  Private
router.post("/:id/avatar", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Upload avatar - TODO" });
});

// @route   GET /api/users/:id/posts
// @desc    Lấy posts của user
// @access  Public
router.get(
  "/:id/posts",
  validateMongoId("id"),
  validatePagination,
  (req, res) => {
    res.json({ message: "Get user posts - TODO" });
  }
);

// @route   GET /api/users/:id/comments
// @desc    Lấy comments của user
// @access  Public
router.get(
  "/:id/comments",
  validateMongoId("id"),
  validatePagination,
  (req, res) => {
    res.json({ message: "Get user comments - TODO" });
  }
);

module.exports = router;
