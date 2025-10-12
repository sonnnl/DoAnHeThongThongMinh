/**
 * FILE: web/backend/models/User.js
 * MỤC ĐÍCH: Schema MongoDB cho User model
 * LIÊN QUAN:
 *   - web/backend/controllers/userController.js
 *   - web/backend/controllers/authController.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 *   - web/backend/models/Report.js
 * CHỨC NĂNG:
 *   - Quản lý thông tin user (profile, avatar, stats)
 *   - Tính toán badge/biệt hiệu dựa trên hoạt động
 *   - Theo dõi restrictions (bị cấm comment, post)
 *   - Đăng nhập Google OAuth
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password không bắt buộc nếu đăng nhập bằng Google
      },
    },

    // Google OAuth
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Profile
    avatar: {
      type: String,
      default: null, // URL ảnh trên cloud (Cloudinary/AWS S3)
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    location: {
      type: String,
      maxlength: 100,
      default: "",
    },
    website: {
      type: String,
      maxlength: 200,
      default: "",
    },

    // Statistics - Dùng để tính badge
    stats: {
      postsCount: {
        type: Number,
        default: 0,
      },
      commentsCount: {
        type: Number,
        default: 0,
      },
      upvotesReceived: {
        type: Number,
        default: 0,
      },
      downvotesReceived: {
        type: Number,
        default: 0,
      },
      upvotesGiven: {
        type: Number,
        default: 0,
      },
      downvotesGiven: {
        type: Number,
        default: 0,
      },
      viewsReceived: {
        type: Number,
        default: 0,
      },
      reportsReceived: {
        type: Number,
        default: 0,
      },
      reportsAccepted: {
        type: Number,
        default: 0, // Số lần bị report và report đó được chấp nhận
      },
      followersCount: {
        type: Number,
        default: 0,
      },
      followingCount: {
        type: Number,
        default: 0,
      },
    },

    // Badge/Biệt hiệu (auto calculated)
    // Newbie: < 10 posts, < 50 comments
    // Người từng trải: 10-50 posts, 50-200 comments
    // Chuyên gia: > 50 posts, > 200 comments, > 500 upvotes
    // Xem chùa: < 5 posts, < 10 comments, > 100 views on profile
    badge: {
      type: String,
      enum: [
        "Newbie",
        "Người từng trải",
        "Chuyên gia",
        "Xem chùa",
        "Người dùng bị hạn chế",
      ],
      default: "Newbie",
    },

    // Role
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    // Restrictions - Xử lý vi phạm
    restrictions: {
      canComment: {
        type: Boolean,
        default: true,
      },
      canPost: {
        type: Boolean,
        default: false, // Phải đăng ký đủ 1 tiếng và comment 3 lần mới được post
      },
      bannedUntil: {
        type: Date,
        default: null, // Null = không bị ban, có giá trị = bị ban đến thời điểm này
      },
      banReason: {
        type: String,
        default: "",
      },
    },

    // Blocked users
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // User preferences
    preferences: {
      // Notifications
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      notifyOnComment: {
        type: Boolean,
        default: true,
      },
      notifyOnUpvote: {
        type: Boolean,
        default: true,
      },
      notifyOnMention: {
        type: Boolean,
        default: true,
      },
      notifyOnFollow: {
        type: Boolean,
        default: true,
      },

      // Privacy
      showEmail: {
        type: Boolean,
        default: false,
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
      allowDirectMessages: {
        type: Boolean,
        default: true,
      },

      // Display
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "vi",
      },
      showNSFW: {
        type: Boolean,
        default: false,
      },
      postsPerPage: {
        type: Number,
        default: 25,
      },
    },

    // Tracking
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// Virtual: Số ngày tham gia
userSchema.virtual("daysJoined").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.registeredAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual: Tổng điểm (score) = upvotes - downvotes
userSchema.virtual("score").get(function () {
  return this.stats.upvotesReceived - this.stats.downvotesReceived;
});

// Method: Hash password trước khi save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Method: So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Tính toán và update badge
userSchema.methods.updateBadge = function () {
  const { postsCount, commentsCount, upvotesReceived } = this.stats;

  // Xem chùa:ít post, comment nhưng nhiều người xem profile
  if (postsCount < 5 && commentsCount < 10) {
    this.badge = "Xem chùa";
  }
  // Newbie
  else if (postsCount < 10 && commentsCount < 50) {
    this.badge = "Newbie";
  }
  // Người từng trải
  else if (postsCount < 50 && commentsCount < 200) {
    this.badge = "Người từng trải";
  }
  // Chuyên gia
  else if (postsCount >= 50 || commentsCount >= 200 || upvotesReceived >= 500) {
    this.badge = "Chuyên gia";
  }

  // Nếu bị hạn chế nhiều
  if (this.stats.reportsAccepted >= 5) {
    this.badge = "Người dùng bị hạn chế";
  }
};

// Method: Kiểm tra có thể post không
userSchema.methods.canCreatePost = function () {
  // Phải đăng ký đủ 1 tiếng
  const oneHourInMs = 60 * 60 * 1000;
  const timeSinceRegistration = Date.now() - this.registeredAt.getTime();

  if (timeSinceRegistration < oneHourInMs) {
    return {
      allowed: false,
      reason: "Bạn cần đăng ký ít nhất 1 tiếng trước khi đăng bài",
    };
  }

  // Phải comment ít nhất 3 lần
  if (this.stats.commentsCount < 3) {
    return {
      allowed: false,
      reason: "Bạn cần comment ít nhất 3 lần trước khi đăng bài",
    };
  }

  // Kiểm tra restrictions
  if (!this.restrictions.canPost) {
    return { allowed: false, reason: "Bạn đang bị hạn chế đăng bài" };
  }

  // Kiểm tra có bị ban không
  if (
    this.restrictions.bannedUntil &&
    this.restrictions.bannedUntil > Date.now()
  ) {
    return {
      allowed: false,
      reason: `Bạn bị cấm đến ${this.restrictions.bannedUntil.toLocaleString(
        "vi-VN"
      )}. Lý do: ${this.restrictions.banReason}`,
    };
  }

  return { allowed: true };
};

// Method: Kiểm tra có thể comment không
userSchema.methods.canCreateComment = function () {
  if (!this.restrictions.canComment) {
    return { allowed: false, reason: "Bạn đang bị hạn chế comment" };
  }

  if (
    this.restrictions.bannedUntil &&
    this.restrictions.bannedUntil > Date.now()
  ) {
    return {
      allowed: false,
      reason: `Bạn bị cấm đến ${this.restrictions.bannedUntil.toLocaleString(
        "vi-VN"
      )}. Lý do: ${this.restrictions.banReason}`,
    };
  }

  return { allowed: true };
};

// Method: Xử lý khi bị report được chấp nhận
userSchema.methods.handleAcceptedReport = function () {
  this.stats.reportsAccepted += 1;

  // Nếu bị report 5 lần được chấp nhận -> cấm comment 1 ngày
  if (this.stats.reportsAccepted >= 5) {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    this.restrictions.bannedUntil = new Date(Date.now() + oneDayInMs);
    this.restrictions.canComment = false;
    this.restrictions.banReason = "Vi phạm quy định cộng đồng nhiều lần";
  }

  this.updateBadge();
};

// Method: Block user
userSchema.methods.blockUser = async function (userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
    await this.save();
  }
};

// Method: Unblock user
userSchema.methods.unblockUser = async function (userId) {
  this.blockedUsers = this.blockedUsers.filter(
    (id) => id.toString() !== userId.toString()
  );
  await this.save();
};

// Method: Kiểm tra có block user không
userSchema.methods.isBlocked = function (userId) {
  return this.blockedUsers.some((id) => id.toString() === userId.toString());
};

// Method: Update last activity
userSchema.methods.updateActivity = async function () {
  this.lastActivityAt = Date.now();
  await this.save();
};

// Index để tìm kiếm nhanh
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ "stats.upvotesReceived": -1 });
userSchema.index({ registeredAt: -1 });
userSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model("User", userSchema);
