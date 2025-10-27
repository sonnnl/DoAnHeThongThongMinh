/**
 * FILE: web/backend/controllers/notificationController.js
 * MỤC ĐÍCH: Xử lý notifications cho users
 * LIÊN QUAN:
 *   - web/backend/models/Notification.js
 *   - web/backend/routes/notificationRoutes.js
 * CHỨC NĂNG:
 *   - Lấy danh sách notifications
 *   - Đánh dấu đã đọc
 *   - Xóa notification
 *   - Đếm unread notifications
 */

const Notification = require("../models/Notification");

// @desc    Lấy notifications của user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { recipient: req.user.id };

    if (type) {
      query.type = type;
    }

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "username avatar badge")
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

// @desc    Đánh dấu notification đã đọc
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy notification",
      });
    }

    notification.isRead = true;
    notification.readAt = Date.now();
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu đọc",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đánh dấu tất cả notifications đã đọc
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu tất cả đã đọc",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy notification",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa notification thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa tất cả notifications
// @route   DELETE /api/notifications
// @access  Private
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });

    res.status(200).json({
      success: true,
      message: "Đã xóa tất cả notifications",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy số lượng unread notifications
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
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

// Helper function để tạo notification (dùng trong các controllers khác)
exports.createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  link,
  metadata,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      metadata,
    });

    // TODO: Send real-time notification qua socket.io hoặc push notification

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
