/**
 * FILE: web/backend/routes/categoryRoutes.js
 * MỤC ĐÍCH: Routes cho categories
 * LIÊN QUAN:
 *   - web/backend/controllers/categoryController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, isAdmin } = require("../middleware/auth");
const {
  validateCreateCategory,
  validateMongoId,
} = require("../middleware/validate");

// @route   GET /api/categories
// @desc    Lấy tất cả categories
// @access  Public
router.get("/", (req, res) => {
  res.json({ message: "Get categories - TODO" });
});

// @route   GET /api/categories/:id
// @desc    Lấy chi tiết category
// @access  Public
router.get("/:id", validateMongoId("id"), (req, res) => {
  res.json({ message: "Get category - TODO" });
});

// @route   POST /api/categories
// @desc    Tạo category mới
// @access  Private (Admin)
router.post("/", authenticate, isAdmin, validateCreateCategory, (req, res) => {
  res.json({ message: "Create category - TODO" });
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put("/:id", authenticate, isAdmin, validateMongoId("id"), (req, res) => {
  res.json({ message: "Update category - TODO" });
});

// @route   DELETE /api/categories/:id
// @desc    Xóa category
// @access  Private (Admin)
router.delete(
  "/:id",
  authenticate,
  isAdmin,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Delete category - TODO" });
  }
);

module.exports = router;
