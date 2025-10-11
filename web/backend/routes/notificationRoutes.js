/**
 * FILE: web/backend/routes/notificationRoutes.js
 * MỤC ĐÍCH: Routes cho notification system
 * LIÊN QUAN:
 *   - web/backend/controllers/notificationController.js
 *   - web/backend/models/Notification.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const {
  validatePagination,
  validateMongoId,
} = require("../middleware/validate");

// @route   GET /api/notifications
// @desc    Lấy danh sách notifications của user
// @access  Private
router.get("/", authenticate, validatePagination, (req, res) => {
  res.json({ message: "Get notifications - TODO" });
});

// @route   GET /api/notifications/unread-count
// @desc    Lấy số notifications chưa đọc
// @access  Private
router.get("/unread-count", authenticate, (req, res) => {
  res.json({ message: "Get unread count - TODO" });
});

// @route   PUT /api/notifications/:id/read
// @desc    Đánh dấu notification đã đọc
// @access  Private
router.put("/:id/read", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Mark as read - TODO" });
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Đánh dấu tất cả đã đọc
// @access  Private
router.put("/mark-all-read", authenticate, (req, res) => {
  res.json({ message: "Mark all as read - TODO" });
});

// @route   DELETE /api/notifications/:id
// @desc    Xóa notification
// @access  Private
router.delete("/:id", authenticate, validateMongoId("id"), (req, res) => {
  res.json({ message: "Delete notification - TODO" });
});

// @route   DELETE /api/notifications
// @desc    Xóa tất cả notifications
// @access  Private
router.delete("/", authenticate, (req, res) => {
  res.json({ message: "Delete all notifications - TODO" });
});

module.exports = router;
