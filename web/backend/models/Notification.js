/**
 * FILE: web/backend/models/Notification.js
 * MỤC ĐÍCH: Schema MongoDB cho Notification model
 * LIÊN QUAN:
 *   - web/backend/controllers/notificationController.js
 *   - web/backend/models/User.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 * CHỨC NĂNG:
 *   - Quản lý thông báo cho users
 *   - Thông báo khi có upvote, comment, reply, mention
 *   - Thông báo từ system (ban, warning, etc.)
 *   - Real-time notifications (WebSocket ready)
 */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận thông báo
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Người tạo thông báo (có thể null nếu từ system)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Loại thông báo
    type: {
      type: String,
      enum: [
        // Post related
        "post_upvote", // Ai đó upvote post của bạn
        "post_comment", // Ai đó comment vào post của bạn
        "post_mention", // Ai đó mention bạn trong post

        // Comment related
        "comment_upvote", // Ai đó upvote comment của bạn
        "comment_reply", // Ai đó reply comment của bạn
        "comment_mention", // Ai đó mention bạn trong comment

        // Direct message
        "new_message", // Tin nhắn mới

        // Moderation
        "post_removed", // Post của bạn bị xóa
        "comment_removed", // Comment của bạn bị xóa
        "user_banned", // Bạn bị ban
        "user_unbanned", // Bạn được unban
        "report_accepted", // Report của bạn được chấp nhận
        "report_rejected", // Report của bạn bị từ chối

        // System
        "welcome", // Chào mừng user mới
        "badge_earned", // Đạt badge mới
        "achievement", // Đạt thành tích gì đó
        "system_announcement", // Thông báo từ system
      ],
      required: true,
    },

    // Tiêu đề (optional, có thể tự generate)
    title: {
      type: String,
      maxlength: 200,
    },

    // Nội dung thông báo
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Target reference (post, comment, message, etc.)
    targetType: {
      type: String,
      enum: ["Post", "Comment", "DirectMessage", "User", null],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetType",
    },

    // Link to navigate (optional)
    link: {
      type: String,
      maxlength: 500,
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,

    // ✨ Priority (để sắp xếp notifications quan trọng lên trên)
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Metadata (tùy chỉnh theo type)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Lấy notifications của user nhanh
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ targetType: 1, targetId: 1 }); // ✨ Index cho query theo target
notificationSchema.index({ type: 1, recipient: 1 }); // ✨ Index cho filter theo type

// Method: Đánh dấu đã đọc
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = Date.now();
    await this.save();
  }
};

// Static: Tạo notification
notificationSchema.statics.createNotification = async function (data) {
  const {
    recipient,
    sender,
    type,
    title,
    message,
    targetType,
    targetId,
    link,
    metadata,
    priority,
  } = data;

  // Không tạo notification nếu sender = recipient
  if (sender && sender.toString() === recipient.toString()) {
    return null;
  }

  const notification = await this.create({
    recipient,
    sender,
    type,
    title,
    message,
    targetType,
    targetId,
    link,
    metadata,
    priority: priority || "normal",
  });

  // TODO: Emit WebSocket event cho real-time notification
  // io.to(recipient.toString()).emit('notification', notification);

  return notification;
};

// Static: Đánh dấu tất cả đã đọc
notificationSchema.statics.markAllAsRead = async function (userId) {
  const result = await this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: Date.now() } }
  );
  return result;
};

// Static: Xóa notifications cũ (chạy định kỳ)
notificationSchema.statics.deleteOldNotifications = async function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });

  return result;
};

module.exports = mongoose.model("Notification", notificationSchema);
