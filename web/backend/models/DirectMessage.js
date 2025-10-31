/**
 * FILE: web/backend/models/DirectMessage.js
 * MỤC ĐÍCH: Schema MongoDB cho DirectMessage model
 * LIÊN QUAN:
 *   - web/backend/models/Conversation.js
 *   - web/backend/models/User.js
 *   - web/backend/controllers/messageController.js
 *   - ai/toxic_detection/predict.py
 * CHỨC NĂNG:
 *   - Quản lý tin nhắn trong conversations
 *   - Hỗ trợ text, ảnh, file
 *   - Encrypt messages (optional)
 *   - Detect toxic bằng AI
 *   - Soft delete, edit tracking
 */

const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema(
  {
    // Conversation mà message này thuộc về
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    // Người gửi
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Loại message
    type: {
      type: String,
      enum: ["text", "image", "file", "system"], // system = tin nhắn từ hệ thống
      default: "text",
    },

    // Nội dung
    content: {
      type: String,
      required: function () {
        return this.type === "text" && !this.isDeleted;
      },
      maxlength: 5000,
    },

    // Media/Files
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "file"],
        },
        url: String,
        publicId: String,
        filename: String,
        size: Number,
        mimeType: String,
      },
    ],

    // Reply to message (quote)
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DirectMessage",
    },

    // ✨ Mentions (@username) - để notify users được mention
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // AI Analysis - Toxic detection
    aiAnalysis: {
      isToxic: {
        type: Boolean,
        default: false,
      },
      toxicScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      analyzedAt: Date,
    },

    // Read status
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index
directMessageSchema.index({ conversation: 1, createdAt: -1 });
directMessageSchema.index({ sender: 1, createdAt: -1 });
directMessageSchema.index({ replyTo: 1 }); // ✨ Index cho queries của replies
directMessageSchema.index({ conversation: 1, isDeleted: 1, createdAt: -1 }); // ✨ Composite cho filter

// Method: Mark as read by user
directMessageSchema.methods.markAsRead = async function (userId) {
  // Kiểm tra đã đọc chưa
  const alreadyRead = this.readBy.some(
    (r) => r.user.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: Date.now(),
    });
    await this.save();
  }
};

// Method: Soft delete
directMessageSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedBy = userId;
  this.deletedAt = Date.now();
  this.content = "";
  this.attachments = [];
  await this.save();
};

// Method: Edit message
directMessageSchema.methods.editMessage = async function (newContent) {
  // Lưu vào history
  this.editHistory.push({
    content: this.content,
    editedAt: Date.now(),
  });

  this.content = newContent;
  this.isEdited = true;
  this.editedAt = Date.now();

  await this.save();
};

// Post-save: Update conversation last message
directMessageSchema.post("save", async function (doc) {
  if (!doc.isDeleted && doc.type !== "system") {
    const Conversation = mongoose.model("Conversation");
    const conversation = await Conversation.findById(doc.conversation);

    if (conversation) {
      await conversation.updateLastMessage(doc);
      await conversation.incrementUnreadCount(doc.sender);
    }

    // ⚠️ OPTIMIZATION: Tạo notifications batch thay vì từng cái
    // Tạo notification cho participants
    const Notification = mongoose.model("Notification");
    const participants = conversation.participants.filter(
      (p) => p.user.toString() !== doc.sender.toString()
    );

    // ✨ BETTER: Dùng insertMany thay vì loop với createNotification
    if (participants.length > 0) {
      const notifications = participants.map((participant) => ({
        recipient: participant.user,
        sender: doc.sender,
        type: "new_message",
        message: `Bạn có tin nhắn mới`,
        targetType: "DirectMessage",
        targetId: doc._id,
        // ✅ FIX: Link đúng format cho messages page với query param
        link: `/messages?conversation=${conversation._id}`,
      }));

      await Notification.insertMany(notifications);

      // TODO: Emit WebSocket events for real-time
      // for (const notif of notifications) {
      //   io.to(notif.recipient.toString()).emit('notification', notif);
      // }
    }
  }
});

module.exports = mongoose.model("DirectMessage", directMessageSchema);
