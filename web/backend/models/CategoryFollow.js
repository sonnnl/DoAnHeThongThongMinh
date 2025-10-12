/**
 * FILE: web/backend/models/CategoryFollow.js
 * MỤC ĐÍCH: Schema MongoDB cho CategoryFollow model
 * LIÊN QUAN:
 *   - web/backend/models/Category.js
 *   - web/backend/models/User.js
 *   - web/backend/controllers/categoryController.js
 * CHỨC NĂNG:
 *   - Quản lý users follow categories
 *   - Tracking số followers của category
 *   - Notification khi có post mới trong category đang follow
 */

const mongoose = require("mongoose");

const categoryFollowSchema = new mongoose.Schema(
  {
    // User theo dõi category
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Category được theo dõi
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // Settings
    settings: {
      // Nhận notification khi có post mới
      notifyOnNewPost: {
        type: Boolean,
        default: true,
      },
      // Nhận notification khi có hot post (nhiều upvotes)
      notifyOnHotPost: {
        type: Boolean,
        default: false,
      },
      // Mute tất cả notifications từ category này
      muteAll: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index: User không thể follow cùng 1 category 2 lần
categoryFollowSchema.index({ user: 1, category: 1 }, { unique: true });

// Index cho queries
categoryFollowSchema.index({ user: 1, createdAt: -1 });
categoryFollowSchema.index({ category: 1, createdAt: -1 });

// Post-save: Tăng followers count
categoryFollowSchema.post("save", async function (doc) {
  await mongoose.model("Category").findByIdAndUpdate(doc.category, {
    $inc: { "stats.followersCount": 1 },
  });
});

// Post-remove: Giảm followers count
categoryFollowSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose.model("Category").findByIdAndUpdate(doc.category, {
      $inc: { "stats.followersCount": -1 },
    });
  }
});

// Static: Follow category
categoryFollowSchema.statics.followCategory = async function (
  userId,
  categoryId
) {
  try {
    const follow = await this.create({
      user: userId,
      category: categoryId,
    });
    return follow;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Bạn đã follow category này rồi");
    }
    throw error;
  }
};

// Static: Unfollow category
categoryFollowSchema.statics.unfollowCategory = async function (
  userId,
  categoryId
) {
  const result = await this.findOneAndDelete({
    user: userId,
    category: categoryId,
  });

  if (!result) {
    throw new Error("Bạn chưa follow category này");
  }

  return result;
};

// Static: Kiểm tra có đang follow không
categoryFollowSchema.statics.isFollowing = async function (userId, categoryId) {
  const follow = await this.findOne({
    user: userId,
    category: categoryId,
  });
  return !!follow;
};

// Static: Lấy tất cả categories user đang follow
categoryFollowSchema.statics.getUserFollowedCategories = async function (
  userId,
  options = {}
) {
  const { limit = 50, skip = 0 } = options;

  const follows = await this.find({ user: userId })
    .populate("category")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return follows.map((f) => f.category);
};

// Static: Lấy danh sách users đang follow category (dùng cho sending notifications)
categoryFollowSchema.statics.getCategoryFollowers = async function (
  categoryId,
  options = {}
) {
  const { notifyOnNewPost = true, muteAll = false } = options;

  const query = { category: categoryId };

  // Chỉ lấy users có bật notification
  if (notifyOnNewPost) {
    query["settings.notifyOnNewPost"] = true;
    query["settings.muteAll"] = false;
  }

  const follows = await this.find(query).select("user");

  return follows.map((f) => f.user);
};

// Static: Update settings
categoryFollowSchema.statics.updateSettings = async function (
  userId,
  categoryId,
  settings
) {
  const follow = await this.findOne({ user: userId, category: categoryId });

  if (!follow) {
    throw new Error("Bạn chưa follow category này");
  }

  follow.settings = { ...follow.settings, ...settings };
  await follow.save();

  return follow;
};

module.exports = mongoose.model("CategoryFollow", categoryFollowSchema);
