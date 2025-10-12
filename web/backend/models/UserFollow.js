/**
 * FILE: web/backend/models/UserFollow.js
 * MỤC ĐÍCH: Schema MongoDB cho UserFollow model
 * LIÊN QUAN:
 *   - web/backend/models/User.js
 *   - web/backend/controllers/userController.js
 *   - web/backend/models/Notification.js
 * CHỨC NĂNG:
 *   - Quản lý quan hệ follow giữa users
 *   - Tracking followers/following
 *   - Tạo notification khi được follow
 */

const mongoose = require("mongoose");

const userFollowSchema = new mongoose.Schema(
  {
    // Người thực hiện follow
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Người được follow
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Metadata
    metadata: {
      // Mute notifications từ người này
      muteNotifications: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index: Không thể follow cùng 1 người 2 lần
userFollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index cho queries
userFollowSchema.index({ follower: 1, createdAt: -1 }); // Lấy following list
userFollowSchema.index({ following: 1, createdAt: -1 }); // Lấy followers list

// Pre-save: Không cho phép tự follow chính mình
userFollowSchema.pre("save", function (next) {
  if (this.follower.toString() === this.following.toString()) {
    return next(new Error("Không thể follow chính mình"));
  }
  next();
});

// Post-save: Tạo notification
userFollowSchema.post("save", async function (doc) {
  // Tạo notification cho người được follow
  const Notification = mongoose.model("Notification");
  await Notification.createNotification({
    recipient: doc.following,
    sender: doc.follower,
    type: "user_followed",
    message: "đã bắt đầu follow bạn",
    targetType: "User",
    targetId: doc.follower,
    link: `/user/${doc.follower}`,
    priority: "normal",
  });

  // Update followers/following count
  await mongoose
    .model("User")
    .findByIdAndUpdate(doc.follower, { $inc: { "stats.followingCount": 1 } });

  await mongoose
    .model("User")
    .findByIdAndUpdate(doc.following, { $inc: { "stats.followersCount": 1 } });
});

// Post-remove: Giảm count
userFollowSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose.model("User").findByIdAndUpdate(doc.follower, {
      $inc: { "stats.followingCount": -1 },
    });

    await mongoose.model("User").findByIdAndUpdate(doc.following, {
      $inc: { "stats.followersCount": -1 },
    });
  }
});

// Static: Follow user
userFollowSchema.statics.followUser = async function (followerId, followingId) {
  if (followerId.toString() === followingId.toString()) {
    throw new Error("Không thể follow chính mình");
  }

  try {
    const follow = await this.create({
      follower: followerId,
      following: followingId,
    });
    return follow;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Bạn đã follow người này rồi");
    }
    throw error;
  }
};

// Static: Unfollow user
userFollowSchema.statics.unfollowUser = async function (
  followerId,
  followingId
) {
  const result = await this.findOneAndDelete({
    follower: followerId,
    following: followingId,
  });

  if (!result) {
    throw new Error("Bạn chưa follow người này");
  }

  return result;
};

// Static: Kiểm tra có đang follow không
userFollowSchema.statics.isFollowing = async function (
  followerId,
  followingId
) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId,
  });
  return !!follow;
};

// Static: Lấy danh sách followers
userFollowSchema.statics.getFollowers = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  const followers = await this.find({ following: userId })
    .populate("follower", "username avatar badge stats.upvotesReceived")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return followers.map((f) => f.follower);
};

// Static: Lấy danh sách following
userFollowSchema.statics.getFollowing = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;

  const following = await this.find({ follower: userId })
    .populate("following", "username avatar badge stats.upvotesReceived")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return following.map((f) => f.following);
};

module.exports = mongoose.model("UserFollow", userFollowSchema);
