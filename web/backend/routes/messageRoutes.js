/**
 * FILE: web/backend/routes/messageRoutes.js
 * MỤC ĐÍCH: Routes cho direct messages
 * LIÊN QUAN:
 *   - web/backend/controllers/messageController.js
 *   - web/backend/models/Conversation.js
 *   - web/backend/models/DirectMessage.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const {
  validatePagination,
  validateMongoId,
} = require("../middleware/validate");

// ============ Conversations ============

// @route   GET /api/messages/conversations
// @desc    Lấy danh sách conversations của user
// @access  Private
router.get("/conversations", authenticate, validatePagination, (req, res) => {
  res.json({ message: "Get conversations - TODO" });
});

// @route   GET /api/messages/conversations/:id
// @desc    Lấy chi tiết conversation
// @access  Private
router.get(
  "/conversations/:id",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Get conversation - TODO" });
  }
);

// @route   POST /api/messages/conversations/direct
// @desc    Tạo hoặc lấy direct conversation với user
// @access  Private
router.post("/conversations/direct", authenticate, (req, res) => {
  res.json({ message: "Create/get direct conversation - TODO" });
});

// @route   POST /api/messages/conversations/group
// @desc    Tạo group conversation
// @access  Private
router.post("/conversations/group", authenticate, (req, res) => {
  res.json({ message: "Create group conversation - TODO" });
});

// @route   PUT /api/messages/conversations/:id
// @desc    Update conversation (name, avatar cho group)
// @access  Private
router.put(
  "/conversations/:id",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Update conversation - TODO" });
  }
);

// @route   POST /api/messages/conversations/:id/add-member
// @desc    Thêm member vào group
// @access  Private
router.post(
  "/conversations/:id/add-member",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Add member - TODO" });
  }
);

// @route   POST /api/messages/conversations/:id/remove-member
// @desc    Xóa member khỏi group
// @access  Private
router.post(
  "/conversations/:id/remove-member",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Remove member - TODO" });
  }
);

// @route   POST /api/messages/conversations/:id/leave
// @desc    Rời khỏi group
// @access  Private
router.post(
  "/conversations/:id/leave",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Leave group - TODO" });
  }
);

// @route   PUT /api/messages/conversations/:id/mute
// @desc    Tắt thông báo cho conversation
// @access  Private
router.put(
  "/conversations/:id/mute",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Mute conversation - TODO" });
  }
);

// @route   DELETE /api/messages/conversations/:id
// @desc    Xóa conversation (soft delete)
// @access  Private
router.delete(
  "/conversations/:id",
  authenticate,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Delete conversation - TODO" });
  }
);

// ============ Messages ============

// @route   GET /api/messages/:conversationId
// @desc    Lấy messages trong conversation
// @access  Private
router.get(
  "/:conversationId",
  authenticate,
  validateMongoId("conversationId"),
  validatePagination,
  (req, res) => {
    res.json({ message: "Get messages - TODO" });
  }
);

// @route   POST /api/messages/:conversationId
// @desc    Gửi message mới
// @access  Private
router.post(
  "/:conversationId",
  authenticate,
  validateMongoId("conversationId"),
  (req, res) => {
    res.json({ message: "Send message - TODO" });
  }
);

// @route   PUT /api/messages/:conversationId/:messageId
// @desc    Edit message
// @access  Private (author only)
router.put(
  "/:conversationId/:messageId",
  authenticate,
  validateMongoId("conversationId"),
  validateMongoId("messageId"),
  (req, res) => {
    res.json({ message: "Edit message - TODO" });
  }
);

// @route   DELETE /api/messages/:conversationId/:messageId
// @desc    Xóa message
// @access  Private (author only)
router.delete(
  "/:conversationId/:messageId",
  authenticate,
  validateMongoId("conversationId"),
  validateMongoId("messageId"),
  (req, res) => {
    res.json({ message: "Delete message - TODO" });
  }
);

// @route   PUT /api/messages/:conversationId/mark-read
// @desc    Đánh dấu tất cả messages đã đọc
// @access  Private
router.put(
  "/:conversationId/mark-read",
  authenticate,
  validateMongoId("conversationId"),
  (req, res) => {
    res.json({ message: "Mark as read - TODO" });
  }
);

module.exports = router;
