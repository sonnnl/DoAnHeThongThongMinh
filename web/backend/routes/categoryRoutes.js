/**
 * FILE: web/backend/routes/categoryRoutes.js
 * MỤC ĐÍCH: Routes cho categories
 * LIÊN QUAN:
 *   - web/backend/controllers/categoryController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, isAdmin, optionalAuth, isModerator } = require("../middleware/auth");
const categoryController = require("../controllers/categoryController");

// @route   GET /api/categories/trending
// @desc    Lấy trending categories
// @access  Public
router.get("/trending", categoryController.getTrendingCategories);

// @route   GET /api/categories/following
// @desc    Lấy categories user đang follow
// @access  Private
router.get(
  "/following",
  authenticate,
  categoryController.getFollowingCategories
);

// @route   GET /api/categories
// @desc    Lấy tất cả categories
// @access  Public
router.get("/", optionalAuth, categoryController.getCategories);

// @route   GET /api/categories/admin
// @desc    Admin: Lấy tất cả categories (kể cả inactive)
// @access  Private (Moderator/Admin)
router.get(
  "/admin",
  authenticate,
  isModerator,
  categoryController.adminGetCategories
);

// @route   POST /api/categories
// @desc    Tạo category mới
// @access  Private (Admin only)
router.post("/", authenticate, isAdmin, categoryController.createCategory);

// @route   GET /api/categories/:slug
// @desc    Lấy chi tiết category
// @access  Public
router.get("/:slug", optionalAuth, categoryController.getCategory);

// @route   PUT /api/categories/:categoryId
// @desc    Cập nhật category
// @access  Private (Admin only)
router.put(
  "/:categoryId",
  authenticate,
  isAdmin,
  categoryController.updateCategory
);

// @route   DELETE /api/categories/:categoryId
// @desc    Xóa category
// @access  Private (Admin only)
router.delete(
  "/:categoryId",
  authenticate,
  isAdmin,
  categoryController.deleteCategory
);

// @route   POST /api/categories/:categoryId/follow
// @desc    Follow category
// @access  Private
router.post(
  "/:categoryId/follow",
  authenticate,
  categoryController.followCategory
);

// @route   DELETE /api/categories/:categoryId/follow
// @desc    Unfollow category
// @access  Private
router.delete(
  "/:categoryId/follow",
  authenticate,
  categoryController.unfollowCategory
);

module.exports = router;
