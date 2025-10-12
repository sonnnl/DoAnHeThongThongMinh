/**
 * FILE: web/backend/models/AdminLog.js
 * MỤC ĐÍCH: Schema MongoDB cho AdminLog model
 * LIÊN QUAN:
 *   - web/backend/models/User.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 *   - web/backend/models/Report.js
 *   - web/backend/controllers/adminController.js
 * CHỨC NĂNG:
 *   - Tracking tất cả actions của admin/moderator
 *   - Audit trail cho moderation
 *   - Statistics về moderation activities
 *   - Export logs cho compliance
 */

const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
  {
    // Admin/Moderator thực hiện action
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Loại action
    action: {
      type: String,
      enum: [
        // User actions
        "ban_user",
        "unban_user",
        "promote_to_moderator",
        "demote_from_moderator",
        "verify_user",
        "suspend_user",

        // Content actions
        "remove_post",
        "restore_post",
        "pin_post",
        "unpin_post",
        "feature_post",
        "remove_comment",
        "restore_comment",

        // Report actions
        "accept_report",
        "reject_report",

        // Category actions
        "create_category",
        "update_category",
        "delete_category",
        "add_moderator_to_category",
        "remove_moderator_from_category",

        // System actions
        "update_settings",
        "clear_cache",
        "run_maintenance",
        "export_data",

        // Other
        "other",
      ],
      required: true,
      index: true,
    },

    // Target của action (nếu có)
    targetType: {
      type: String,
      enum: ["User", "Post", "Comment", "Category", "Report", "System", null],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetType",
    },

    // Mô tả ngắn gọn về action
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Lý do thực hiện action
    reason: {
      type: String,
      maxlength: 1000,
      default: "",
    },

    // Metadata - Lưu thông tin chi tiết
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Ví dụ:
      // {
      //   previousValue: {...},
      //   newValue: {...},
      //   affectedUsers: [...],
      //   duration: 7 (days),
      //   reportId: ObjectId
      // }
    },

    // Severity level
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // IP address của admin
    ipAddress: {
      type: String,
      default: null,
    },

    // User agent
    userAgent: {
      type: String,
      default: null,
    },

    // Status (nếu action có thể bị revert)
    status: {
      type: String,
      enum: ["active", "reverted", "expired"],
      default: "active",
    },

    // Thời gian hết hạn (cho temporary bans, etc.)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ severity: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 }); // For recent logs
adminLogSchema.index({ status: 1, expiresAt: 1 }); // For expired logs cleanup

// Static: Tạo log
adminLogSchema.statics.createLog = async function (data) {
  const {
    admin,
    action,
    targetType,
    targetId,
    description,
    reason,
    metadata,
    severity,
    ipAddress,
    userAgent,
    expiresAt,
  } = data;

  const log = await this.create({
    admin,
    action,
    targetType,
    targetId,
    description,
    reason: reason || "",
    metadata: metadata || {},
    severity: severity || "medium",
    ipAddress,
    userAgent,
    expiresAt,
  });

  return log;
};

// Static: Lấy logs của admin
adminLogSchema.statics.getAdminLogs = async function (adminId, options = {}) {
  const { limit = 50, skip = 0, action, startDate, endDate } = options;

  const query = { admin: adminId };

  if (action) {
    query.action = action;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const logs = await this.find(query)
    .populate("admin", "username avatar role")
    .populate("targetId")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return logs;
};

// Static: Lấy logs về một target cụ thể
adminLogSchema.statics.getTargetLogs = async function (
  targetType,
  targetId,
  options = {}
) {
  const { limit = 20, skip = 0 } = options;

  const logs = await this.find({ targetType, targetId })
    .populate("admin", "username avatar role")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return logs;
};

// Static: Statistics - Tổng hợp hoạt động moderation
adminLogSchema.statics.getStatistics = async function (options = {}) {
  const { startDate, endDate, adminId } = options;

  const matchQuery = {};

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
  }

  if (adminId) {
    matchQuery.admin = new mongoose.Types.ObjectId(adminId);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Tổng hợp theo admin
  const adminStats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$admin",
        totalActions: { $sum: 1 },
        actions: { $push: "$action" },
      },
    },
    { $sort: { totalActions: -1 } },
  ]);

  return {
    byAction: stats,
    byAdmin: adminStats,
  };
};

// Static: Xóa logs cũ (chạy định kỳ)
adminLogSchema.statics.deleteOldLogs = async function (days = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $in: ["low", "medium"] }, // Chỉ xóa logs không quan trọng
  });

  return result;
};

// Method: Revert action (nếu có thể)
adminLogSchema.methods.revert = async function (revertedBy, reason) {
  this.status = "reverted";
  this.metadata.revertedBy = revertedBy;
  this.metadata.revertedAt = Date.now();
  this.metadata.revertReason = reason;
  await this.save();

  // Tạo log mới cho action revert
  await mongoose.model("AdminLog").createLog({
    admin: revertedBy,
    action: "revert_action",
    targetType: "AdminLog",
    targetId: this._id,
    description: `Đã revert action: ${this.action}`,
    reason,
    severity: "medium",
  });
};

module.exports = mongoose.model("AdminLog", adminLogSchema);
