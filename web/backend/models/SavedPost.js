/**
 * FILE: web/backend/models/SavedPost.js
 * MỤC ĐÍCH: Schema MongoDB cho SavedPost model
 * LIÊN QUAN:
 *   - web/backend/models/User.js
 *   - web/backend/models/Post.js
 *   - web/backend/controllers/userController.js
 * CHỨC NĂNG:
 *   - Quản lý bài viết được lưu bởi users
 *   - Hỗ trợ collections/folders để tổ chức
 *   - Tracking thời gian lưu
 */

const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema(
  {
    // User lưu bài viết
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Bài viết được lưu
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // Collection/Folder name (optional)
    collection: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "Mặc định", // Default collection
    },

    // Notes riêng của user về bài viết này
    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },

    // Tags riêng để tìm kiếm
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Composite unique index: User không thể lưu cùng 1 post 2 lần
savedPostSchema.index({ user: 1, post: 1 }, { unique: true });

// Index cho queries
savedPostSchema.index({ user: 1, collection: 1, createdAt: -1 });
savedPostSchema.index({ user: 1, tags: 1 });

// Static: Lưu post
savedPostSchema.statics.savePost = async function (userId, postId, data = {}) {
  const { collection, notes, tags } = data;

  try {
    const saved = await this.create({
      user: userId,
      post: postId,
      collection: collection || "Mặc định",
      notes: notes || "",
      tags: tags || [],
    });

    return saved;
  } catch (error) {
    // Nếu đã lưu rồi thì update
    if (error.code === 11000) {
      const saved = await this.findOneAndUpdate(
        { user: userId, post: postId },
        {
          $set: {
            collection: collection || "Mặc định",
            notes: notes || "",
            tags: tags || [],
          },
        },
        { new: true }
      );
      return saved;
    }
    throw error;
  }
};

// Static: Unsave post
savedPostSchema.statics.unsavePost = async function (userId, postId) {
  const result = await this.findOneAndDelete({ user: userId, post: postId });
  return result;
};

// Static: Lấy tất cả collections của user
savedPostSchema.statics.getUserCollections = async function (userId) {
  const collections = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$collection",
        count: { $sum: 1 },
        lastSaved: { $max: "$createdAt" },
      },
    },
    { $sort: { lastSaved: -1 } },
  ]);

  return collections.map((c) => ({
    name: c._id,
    count: c.count,
    lastSaved: c.lastSaved,
  }));
};

// Static: Kiểm tra user đã lưu post chưa
savedPostSchema.statics.isSaved = async function (userId, postId) {
  const saved = await this.findOne({ user: userId, post: postId });
  return !!saved;
};

module.exports = mongoose.model("SavedPost", savedPostSchema);
