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
      participants: req.user.id,
    })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("participants", "username avatar badge")
      .populate("lastMessage")
      .lean();

    // Tính unread count cho mỗi conversation
    for (let conv of conversations) {
      const unreadCount = await DirectMessage.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user.id },
        isRead: false,
      });
      conv.unreadCount = unreadCount;

      // Lấy other participant
      conv.otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== req.user.id
      );
    }

    const total = await Conversation.countDocuments({
      participants: req.user.id,
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

    // Tìm conversation hiện có
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] },
    })
      .populate("participants", "username avatar badge")
      .populate("lastMessage");

    // Nếu chưa có, tạo mới
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId],
      });

      await conversation.populate("participants", "username avatar badge");
    }

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

    if (!conversation.participants.includes(req.user.id)) {
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

    // Đánh dấu messages là đã đọc
    await DirectMessage.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        isRead: false,
      },
      { isRead: true, readAt: Date.now() }
    );

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
    const { conversationId, content, mediaUrl } = req.body;

    // Kiểm tra conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy conversation",
      });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền gửi tin nhắn trong conversation này",
      });
    }

    // Tạo message
    const message = await DirectMessage.create({
      conversation: conversationId,
      sender: req.user.id,
      content,
      mediaUrl: mediaUrl || null,
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    await message.populate("sender", "username avatar badge");

    // TODO: Send real-time message qua socket.io

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

// @desc    Lấy unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    // Lấy tất cả conversations của user
    const conversations = await Conversation.find({
      participants: req.user.id,
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    const count = await DirectMessage.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user.id },
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};
