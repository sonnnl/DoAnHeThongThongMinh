/**
 * FILE: web/backend/routes/messageRoutes.js
 * MỤC ĐÍCH: Routes cho direct messages
 * LIÊN QUAN:
 *   - web/backend/controllers/messageController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const messageController = require("../controllers/messageController");

// @route   GET /api/messages/conversations
// @desc    Lấy danh sách conversations
// @access  Private
router.get("/conversations", authenticate, messageController.getConversations);

// @route   GET /api/messages/unread-count
// @desc    Lấy số lượng unread messages
// @access  Private
router.get("/unread-count", authenticate, messageController.getUnreadCount);

// @route   GET /api/messages/conversations/:userId
// @desc    Lấy hoặc tạo conversation với user
// @access  Private
router.get(
  "/conversations/:userId",
  authenticate,
  messageController.getOrCreateConversation
);

// @route   GET /api/messages/conversations/:conversationId/messages
// @desc    Lấy messages trong conversation
// @access  Private
router.get(
  "/conversations/:conversationId/messages",
  authenticate,
  messageController.getMessages
);

// @route   PUT /api/messages/conversations/:conversationId/mark-read
// @desc    Đánh dấu conversation là đã đọc
// @access  Private
router.put(
  "/conversations/:conversationId/mark-read",
  authenticate,
  messageController.markConversationAsRead
);

// @route   POST /api/messages/conversations/group
// @desc    Tạo group conversation
// @access  Private
router.post(
  "/conversations/group",
  authenticate,
  messageController.createGroupConversation
);

// @route   POST /api/messages/conversations/:conversationId/participants
// @desc    Thêm người vào group
// @access  Private
router.post(
  "/conversations/:conversationId/participants",
  authenticate,
  messageController.addParticipant
);

// @route   DELETE /api/messages/conversations/:conversationId/participants/:userId
// @desc    Xóa người khỏi group
// @access  Private
router.delete(
  "/conversations/:conversationId/participants/:userId",
  authenticate,
  messageController.removeParticipant
);

// @route   POST /api/messages
// @desc    Gửi message
// @access  Private
router.post("/", authenticate, messageController.sendMessage);

// @route   DELETE /api/messages/:messageId
// @desc    Xóa message
// @access  Private
router.delete("/:messageId", authenticate, messageController.deleteMessage);

module.exports = router;
