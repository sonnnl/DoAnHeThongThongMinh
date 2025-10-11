/**
 * FILE: web/backend/models/Report.js
 * MỤC ĐÍCH: Schema MongoDB cho Report model
 * LIÊN QUAN:
 *   - web/backend/controllers/reportController.js
 *   - web/backend/models/User.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 * CHỨC NĂNG:
 *   - Quản lý reports từ users về posts/comments vi phạm
 *   - Moderators review và accept/reject reports
 *   - Tự động ban user nếu bị report nhiều lần được chấp nhận
 *   - Tracking moderation actions
 */

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Người report
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Target (post hoặc comment bị report)
    targetType: {
      type: String,
      enum: ["Post", "Comment", "User"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },

    // Lý do report
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "violence",
        "sexual_content",
        "misinformation",
        "copyright",
        "personal_information",
        "self_harm",
        "other",
      ],
      required: true,
    },

    // Mô tả chi tiết
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "reviewing", "accepted", "rejected", "resolved"],
      default: "pending",
    },

    // Moderator xử lý
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,

    // Action taken
    action: {
      type: String,
      enum: [
        "none",
        "warning",
        "content_removed",
        "user_banned_1day",
        "user_banned_7days",
        "user_banned_30days",
        "user_banned_permanent",
      ],
      default: "none",
    },

    // Ghi chú của moderator
    moderatorNotes: {
      type: String,
      maxlength: 2000,
      default: "",
    },

    // Priority (dựa vào số reports cho cùng target)
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "low",
    },
  },
  {
    timestamps: true,
  }
);

// Index
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reviewedBy: 1 });
reportSchema.index({ priority: -1, createdAt: 1 });

// Composite index: Một user chỉ report 1 lần cho 1 target
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

// Method: Accept report và thực hiện action
reportSchema.methods.accept = async function (reviewerId, action, notes = "") {
  this.status = "accepted";
  this.reviewedBy = reviewerId;
  this.reviewedAt = Date.now();
  this.action = action;
  this.moderatorNotes = notes;

  await this.save();

  // Thực hiện action
  const TargetModel = mongoose.model(this.targetType);
  const target = await TargetModel.findById(this.targetId);

  if (!target) {
    return;
  }

  // Tăng report count cho target author
  const targetAuthorId = target.author || target._id; // User report thì targetId chính là userId

  await mongoose
    .model("User")
    .findByIdAndUpdate(targetAuthorId, {
      $inc: { "stats.reportsReceived": 1, "stats.reportsAccepted": 1 },
    });

  // Thực hiện action
  switch (action) {
    case "content_removed":
      if (this.targetType === "Post") {
        target.status = "removed";
        target.removedBy = reviewerId;
        target.removedReason = this.reason;
        target.removedAt = Date.now();
        await target.save();
      } else if (this.targetType === "Comment") {
        await target.softDelete(reviewerId);
      }
      break;

    case "user_banned_1day":
      await this.banUser(targetAuthorId, 1, notes);
      break;

    case "user_banned_7days":
      await this.banUser(targetAuthorId, 7, notes);
      break;

    case "user_banned_30days":
      await this.banUser(targetAuthorId, 30, notes);
      break;

    case "user_banned_permanent":
      await this.banUser(targetAuthorId, 36500, notes); // 100 years
      break;
  }

  // Update user's badge nếu bị report nhiều
  const user = await mongoose.model("User").findById(targetAuthorId);
  if (user) {
    await user.handleAcceptedReport();
    await user.save();
  }
};

// Method: Reject report
reportSchema.methods.reject = async function (reviewerId, notes = "") {
  this.status = "rejected";
  this.reviewedBy = reviewerId;
  this.reviewedAt = Date.now();
  this.moderatorNotes = notes;

  await this.save();
};

// Helper: Ban user
reportSchema.methods.banUser = async function (userId, days, reason) {
  const banUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await mongoose.model("User").findByIdAndUpdate(userId, {
    "restrictions.bannedUntil": banUntil,
    "restrictions.canComment": false,
    "restrictions.canPost": false,
    "restrictions.banReason": reason,
  });
};

// Static: Tính priority dựa vào số reports cho cùng target
reportSchema.statics.calculatePriority = async function (targetType, targetId) {
  const reportsCount = await this.countDocuments({
    targetType,
    targetId,
    status: { $in: ["pending", "reviewing"] },
  });

  if (reportsCount >= 10) return "urgent";
  if (reportsCount >= 5) return "high";
  if (reportsCount >= 2) return "medium";
  return "low";
};

// Pre-save: Tính priority
reportSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.priority = await mongoose
      .model("Report")
      .calculatePriority(this.targetType, this.targetId);
  }
  next();
});

module.exports = mongoose.model("Report", reportSchema);
