/**
 * FILE: web/backend/routes/notificationRoutes.js
 * MỤC ĐÍCH: Routes cho notifications
 * LIÊN QUAN:
 *   - web/backend/controllers/notificationController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

// @route   GET /api/notifications/unread-count
// @desc    Lấy số lượng unread notifications
// @access  Private
router.get(
  "/unread-count",
  authenticate,
  notificationController.getUnreadCount
);

// @route   PUT /api/notifications/read-all
// @desc    Đánh dấu tất cả notifications đã đọc
// @access  Private
router.put("/read-all", authenticate, notificationController.markAllAsRead);

// @route   GET /api/notifications
// @desc    Lấy danh sách notifications
// @access  Private
router.get("/", authenticate, notificationController.getNotifications);

// @route   DELETE /api/notifications
// @desc    Xóa tất cả notifications
// @access  Private
router.delete("/", authenticate, notificationController.deleteAllNotifications);

// @route   PUT /api/notifications/:notificationId/read
// @desc    Đánh dấu notification đã đọc
// @access  Private
router.put(
  "/:notificationId/read",
  authenticate,
  notificationController.markAsRead
);

// @route   DELETE /api/notifications/:notificationId
// @desc    Xóa notification
// @access  Private
router.delete(
  "/:notificationId",
  authenticate,
  notificationController.deleteNotification
);

module.exports = router;
