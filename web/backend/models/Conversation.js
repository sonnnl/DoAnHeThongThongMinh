/**
 * FILE: web/backend/models/Conversation.js
 * MỤC ĐÍCH: Schema MongoDB cho Conversation model (Direct Messages)
 * LIÊN QUAN:
 *   - web/backend/models/DirectMessage.js
 *   - web/backend/models/User.js
 *   - web/backend/controllers/messageController.js
 * CHỨC NĂNG:
 *   - Quản lý conversations (cuộc trò chuyện) giữa users
 *   - Hỗ trợ group chat (nhiều người)
 *   - Tracking unread messages
 *   - Last message preview
 */

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Loại conversation
    type: {
      type: String,
      enum: ["direct", "group"], // direct = 1-1, group = nhiều người
      default: "direct",
    },

    // Tên group (nếu là group chat)
    name: {
      type: String,
      maxlength: 100,
    },

    // Avatar cho group chat
    avatar: {
      type: String,
    },

    // Participants (người tham gia)
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        // Số tin nhắn chưa đọc của user này
        unreadCount: {
          type: Number,
          default: 0,
        },
        // Lần cuối user đọc conversation
        lastReadAt: {
          type: Date,
          default: Date.now,
        },
        // User có bị mute conversation không
        isMuted: {
          type: Boolean,
          default: false,
        },
        // Thời gian tham gia
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Admin của group (chỉ cho group chat)
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Last message (để hiển thị preview)
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      sentAt: Date,
    },

    // Conversation settings
    settings: {
      // Ai có thể gửi tin nhắn (for group)
      whoCanMessage: {
        type: String,
        enum: ["all", "admins_only"],
        default: "all",
      },
    },

    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index
conversationSchema.index({ "participants.user": 1, lastActivityAt: -1 });
conversationSchema.index({ lastActivityAt: -1 });
conversationSchema.index({ isDeleted: 1 });

// Virtual: Lấy tất cả messages
conversationSchema.virtual("messages", {
  ref: "DirectMessage",
  localField: "_id",
  foreignField: "conversation",
});

// Method: Thêm participant
conversationSchema.methods.addParticipant = async function (userId, addedBy) {
  // Kiểm tra đã có chưa
  const exists = this.participants.some(
    (p) => p.user.toString() === userId.toString()
  );

  if (!exists) {
    this.participants.push({
      user: userId,
      joinedAt: Date.now(),
    });

    await this.save();

    // Tạo system message
    const DirectMessage = mongoose.model("DirectMessage");
    await DirectMessage.create({
      conversation: this._id,
      sender: addedBy,
      content: `đã thêm ${userId} vào nhóm`,
      type: "system",
    });
  }
};

// Method: Remove participant
conversationSchema.methods.removeParticipant = async function (
  userId,
  removedBy
) {
  this.participants = this.participants.filter(
    (p) => p.user.toString() !== userId.toString()
  );

  await this.save();

  // Tạo system message
  const DirectMessage = mongoose.model("DirectMessage");
  await DirectMessage.create({
    conversation: this._id,
    sender: removedBy,
    content: `đã xóa ${userId} khỏi nhóm`,
    type: "system",
  });
};

// Method: Update last message
conversationSchema.methods.updateLastMessage = async function (message) {
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    sentAt: message.createdAt,
  };
  this.lastActivityAt = Date.now();
  await this.save();
};

// Method: Increment unread count cho tất cả participants trừ sender
conversationSchema.methods.incrementUnreadCount = async function (senderId) {
  // ⚠️ FIX: Dùng for...of thay vì forEach để đảm bảo update đúng
  for (const p of this.participants) {
    if (p.user.toString() !== senderId.toString()) {
      p.unreadCount += 1;
    }
  }
  await this.save();
};

// Method: Reset unread count cho user
conversationSchema.methods.markAsRead = async function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadAt = Date.now();
    await this.save();
  }
};

// Static: Tìm hoặc tạo direct conversation giữa 2 users
conversationSchema.statics.findOrCreateDirectConversation = async function (
  user1Id,
  user2Id
) {
  // Tìm conversation có 2 users này
  const conversation = await this.findOne({
    type: "direct",
    isDeleted: false,
    participants: {
      $all: [
        { $elemMatch: { user: user1Id } },
        { $elemMatch: { user: user2Id } },
      ],
    },
  });

  if (conversation) {
    return conversation;
  }

  // Tạo mới
  const newConversation = await this.create({
    type: "direct",
    participants: [{ user: user1Id }, { user: user2Id }],
  });

  return newConversation;
};

// Static: Tạo group conversation
conversationSchema.statics.createGroupConversation = async function (data) {
  const { name, avatar, participants, createdBy } = data;

  // ✨ Validation: Group phải có ít nhất 2 người
  if (!participants || participants.length < 2) {
    throw new Error("Group conversation phải có ít nhất 2 người");
  }

  // ✨ Đảm bảo createdBy có trong participants
  const participantSet = new Set(participants.map((id) => id.toString()));
  if (!participantSet.has(createdBy.toString())) {
    participants.push(createdBy);
  }

  const conversation = await this.create({
    type: "group",
    name,
    avatar,
    participants: participants.map((userId) => ({ user: userId })),
    admins: [createdBy],
    createdBy: createdBy,
  });

  return conversation;
};

module.exports = mongoose.model("Conversation", conversationSchema);
