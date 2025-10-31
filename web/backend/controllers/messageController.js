/**
 * FILE: web/backend/controllers/messageController.js
 * MỤC ĐÍCH: Xử lý direct messages giữa users
 * LIÊN QUAN:
 *   - web/backend/models/DirectMessage.js
 *   - web/backend/models/Conversation.js
 *   - web/backend/models/User.js
 *   - web/backend/routes/messageRoutes.js
 * CHỨC NĂNG:
 *   - Gửi message
 *   - Lấy danh sách conversations
 *   - Lấy messages trong conversation
 *   - Đánh dấu đã đọc
 */

const DirectMessage = require("../models/DirectMessage");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

// @desc    Lấy danh sách conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find({
      "participants.user": req.user.id,
      isDeleted: false,
    })
      .sort({ lastActivityAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("participants.user", "username avatar badge")
      .populate("lastMessage.sender", "username avatar")
      .lean();

    // Tính unread count cho mỗi conversation
    for (let conv of conversations) {
      const participant = conv.participants.find(
        (p) => p.user._id.toString() === req.user.id
      );
      conv.unreadCount = participant ? participant.unreadCount : 0;

      // Lấy other participant (cho direct chat)
      if (conv.type === "direct") {
        conv.otherParticipant = conv.participants.find(
          (p) => p.user._id.toString() !== req.user.id
        )?.user;
      }
    }

    const total = await Conversation.countDocuments({
      "participants.user": req.user.id,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy hoặc tạo conversation với user
// @route   GET /api/messages/conversations/:userId
// @access  Private
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Không thể nhắn tin cho chính mình",
      });
    }

    // Kiểm tra user tồn tại
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Kiểm tra user có cho phép nhận tin nhắn không
    if (!otherUser.preferences.allowDirectMessages) {
      return res.status(403).json({
        success: false,
        message: "User này không nhận tin nhắn",
      });
    }

    // Kiểm tra có bị block không
    const currentUser = await User.findById(req.user.id);
    if (currentUser.isBlocked(userId) || otherUser.isBlocked(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Không thể nhắn tin với user này",
      });
    }

    // Tìm conversation hiện có bằng static method
    let conversation = await Conversation.findOrCreateDirectConversation(
      req.user.id,
      userId
    );

    // Populate thông tin
    await conversation.populate("participants.user", "username avatar badge");
    await conversation.populate("lastMessage.sender", "username avatar");

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy messages trong conversation
// @route   GET /api/messages/conversations/:conversationId/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Kiểm tra user có trong conversation không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy conversation",
      });
    }

    // ✅ FIX: Check participant đúng cách
    const isParticipant = conversation.participants.some(
      (p) => p.user.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem conversation này",
      });
    }

    const messages = await DirectMessage.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "username avatar badge")
      .lean();

    const total = await DirectMessage.countDocuments({
      conversation: conversationId,
    });

    // ✅ FIX: Đánh dấu messages là đã đọc và reset unread count
    await DirectMessage.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        isRead: false,
      },
      { isRead: true, readAt: Date.now() }
    );

    // Reset unread count trong conversation
    await conversation.markAsRead(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse để hiển thị từ cũ đến mới
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gửi message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, content, mediaUrl, mediaData } = req.body;
    // ✅ mediaData: { url, publicId, format, resourceType, size, ... } từ upload API

    // Kiểm tra conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy conversation",
      });
    }

    // ✅ FIX: Check participant đúng cách
    const isParticipant = conversation.participants.some(
      (p) => p.user.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền gửi tin nhắn trong conversation này",
      });
    }

    // ✅ FIX: Tạo message với attachments nếu có media
    const messageData = {
      conversation: conversationId,
      sender: req.user.id,
      content,
    };

    // Thêm media vào attachments nếu có (từ mediaData hoặc mediaUrl fallback)
    if (mediaData || mediaUrl) {
      const attachment = mediaData 
        ? {
            type: mediaData.resourceType === 'video' ? 'file' : 'image',
            url: mediaData.url,
            publicId: mediaData.publicId,
            filename: mediaData.filename || null,
            size: mediaData.size || mediaData.bytes || null,
            mimeType: mediaData.mimeType || mediaData.format || null,
          }
        : {
            // Fallback: nếu chỉ có mediaUrl (backward compatible)
            type: (mediaUrl.includes('/video/') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl)) ? 'file' : 'image',
            url: mediaUrl,
          };

      messageData.attachments = [attachment];

      // Tự động set message type
      const isVideo = (mediaData?.resourceType === 'video') || 
                      mediaUrl?.includes('/video/') || 
                      /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaData?.url || mediaUrl || '');
      messageData.type = isVideo ? "file" : "image";
    }

    const message = await DirectMessage.create(messageData);

    // ✅ FIX: Update conversation bằng method
    await conversation.updateLastMessage(message);
    await conversation.incrementUnreadCount(req.user.id);

    await message.populate("sender", "username avatar badge");

    // ✅ Emit real-time events qua Socket.IO
    const io = req.app.get("io");
    if (io) {
      // Emit vào room của conversation
      io.to(`conversation:${conversationId}`).emit("message:new", {
        conversationId,
        message,
      });

      // Emit cho từng participant (để cập nhật sidebar/unread)
      conversation.participants.forEach((p) => {
        io.to(`user:${p.user.toString()}`).emit("conversation:update", {
          conversationId,
          lastMessage: message,
        });
      });
    }

    res.status(201).json({
      success: true,
      message: "Gửi tin nhắn thành công",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await DirectMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy message",
      });
    }

    // Chỉ người gửi mới có thể xóa
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa message này",
      });
    }

    message.isDeleted = true;
    message.content = "[Tin nhắn đã bị xóa]";
    await message.save();

    res.status(200).json({
      success: true,
      message: "Xóa tin nhắn thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đánh dấu conversation là đã đọc
// @route   PUT /api/messages/conversations/:conversationId/mark-read
// @access  Private
exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy conversation",
      });
    }

    // Kiểm tra user có trong conversation không
    const isParticipant = conversation.participants.some(
      (p) => p.user.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập conversation này",
      });
    }

    // Đánh dấu là đã đọc
    await conversation.markAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu là đã đọc",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo group conversation
// @route   POST /api/messages/conversations/group
// @access  Private
exports.createGroupConversation = async (req, res, next) => {
  try {
    const { name, avatar, participantIds } = req.body;

    // ✨ Validation: Group phải có ít nhất 2 người
    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Group conversation phải có ít nhất 2 người",
      });
    }

    // ✨ Đảm bảo creator có trong participants
    const participantSet = new Set(
      participantIds.map((id) => id.toString())
    );
    if (!participantSet.has(req.user.id)) {
      participantIds.push(req.user.id);
    }

    // Tạo group conversation
    const conversation = await Conversation.createGroupConversation({
      name,
      avatar,
      participants: participantIds,
      createdBy: req.user.id,
    });

    await conversation.populate("participants.user", "username avatar badge");
    await conversation.populate("admins", "username avatar");
    await conversation.populate("createdBy", "username avatar");

    res.status(201).json({
      success: true,
      message: "Tạo nhóm chat thành công",
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm người vào group
// @route   POST /api/messages/conversations/:conversationId/participants
// @access  Private
exports.addParticipant = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy conversation",
      });
    }

    // Chỉ admin mới có thể thêm người vào group
    if (conversation.type === "group") {
      const isAdmin = conversation.admins.some(
        (adminId) => adminId.toString() === req.user.id
      );
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có thể thêm người vào nhóm",
        });
      }
    }

    await conversation.addParticipant(userId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Đã thêm người vào nhóm",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa người khỏi group
// @route   DELETE /api/messages/conversations/:conversationId/participants/:userId
// @access  Private
exports.removeParticipant = async (req, res, next) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy conversation",
      });
    }

    // Chỉ admin hoặc chính người đó mới có thể xóa
    if (conversation.type === "group") {
      const isAdmin = conversation.admins.some(
        (adminId) => adminId.toString() === req.user.id
      );
      const isSelf = userId === req.user.id;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa người này khỏi nhóm",
        });
      }
    }

    await conversation.removeParticipant(userId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Đã xóa người khỏi nhóm",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    // ✅ FIX: Lấy tổng unread count từ conversations
    const conversations = await Conversation.find({
      "participants.user": req.user.id,
      isDeleted: false,
    }).lean();

    // Tính tổng unread count từ participant data
    let totalUnread = 0;
    for (const conv of conversations) {
      const participant = conv.participants.find(
        (p) => p.user.toString() === req.user.id
      );
      if (participant) {
        totalUnread += participant.unreadCount || 0;
      }
    }

    res.status(200).json({
      success: true,
      data: { count: totalUnread },
    });
  } catch (error) {
    next(error);
  }
};
