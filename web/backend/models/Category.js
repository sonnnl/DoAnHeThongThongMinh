/**
 * FILE: web/backend/models/Category.js
 * MỤC ĐÍCH: Schema MongoDB cho Category model
 * LIÊN QUAN:
 *   - web/backend/controllers/categoryController.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/User.js
 * CHỨC NĂNG:
 *   - Quản lý các categories/chủ đề do admin tạo
 *   - Đếm số post trong mỗi category
 *   - Quản lý subcategories (categories con)
 *   - Icon và màu sắc cho mỗi category
 */

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },

    // Tùy chỉnh giao diện
    icon: {
      type: String,
      default: "category", // Icon name từ icon library (FontAwesome, Material Icons)
    },
    color: {
      type: String,
      default: "#3B82F6", // Hex color code
    },
    coverImage: {
      type: String,
      default: null, // URL ảnh cover trên cloud
    },

    // Hierarchy - Danh mục cha/con
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Statistics
    stats: {
      postsCount: {
        type: Number,
        default: 0,
      },
      commentsCount: {
        type: Number,
        default: 0,
      },
      viewsCount: {
        type: Number,
        default: 0,
      },
      followersCount: {
        type: Number,
        default: 0,
      },
    },

    // Settings
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false, // Post cần được duyệt trước khi hiển thị
      },
      allowImages: {
        type: Boolean,
        default: true,
      },
      allowVideos: {
        type: Boolean,
        default: true,
      },
      minKarmaToPost: {
        type: Number,
        default: 0, // Số điểm tối thiểu để post trong category này
      },
    },

    // Moderators - Người quản lý category
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Rules - Quy tắc riêng của category
    rules: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],

    // Thứ tự hiển thị
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional - cho phép seed/import data
      default: null,
    },
    lastPostAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: Lấy tất cả subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

// Method: Tăng số post
categorySchema.methods.incrementPostCount = async function () {
  this.stats.postsCount += 1;
  this.lastPostAt = new Date();
  await this.save();

  // Nếu có parent category, cũng tăng count của parent
  if (this.parentCategory) {
    const parentCat = await mongoose
      .model("Category")
      .findById(this.parentCategory);
    if (parentCat) {
      parentCat.stats.postsCount += 1;
      parentCat.lastPostAt = new Date();
      await parentCat.save();
    }
  }
};

// Method: Giảm số post
categorySchema.methods.decrementPostCount = async function () {
  this.stats.postsCount = Math.max(0, this.stats.postsCount - 1);
  await this.save();

  if (this.parentCategory) {
    const parentCat = await mongoose
      .model("Category")
      .findById(this.parentCategory);
    if (parentCat) {
      parentCat.stats.postsCount = Math.max(0, parentCat.stats.postsCount - 1);
      await parentCat.save();
    }
  }
};

// Method: Kiểm tra user có quyền post trong category không
categorySchema.methods.canUserPost = function (user) {
  if (!this.settings.isActive) {
    return { allowed: false, reason: "Category này hiện không hoạt động" };
  }

  // Kiểm tra karma tối thiểu
  const userScore = user.stats.upvotesReceived - user.stats.downvotesReceived;
  if (userScore < this.settings.minKarmaToPost) {
    return {
      allowed: false,
      reason: `Bạn cần có ít nhất ${this.settings.minKarmaToPost} điểm để đăng bài trong category này`,
    };
  }

  return { allowed: true };
};

// Pre-save: Tự động tạo slug từ name
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

// Index
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ "stats.postsCount": -1 });
categorySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Category", categorySchema);
