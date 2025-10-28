/**
 * FILE: web/backend/models/Post.js
 * MỤC ĐÍCH: Schema MongoDB cho Post model
 * LIÊN QUAN:
 *   - web/backend/controllers/postController.js
 *   - web/backend/models/User.js
 *   - web/backend/models/Category.js
 *   - web/backend/models/Comment.js
 *   - web/backend/models/Vote.js
 *   - ai/toxic_detection/predict.py
 * CHỨC NĂNG:
 *   - Quản lý bài viết (title, content, media)
 *   - Theo dõi upvote/downvote, views, comments
 *   - Tính toán score cho ranking
 *   - Detect spam/toxic bằng AI
 *   - Hỗ trợ ảnh và video (giới hạn 25MB)
 */

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 300,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 50000, // Rich text content
    },

    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Media attachments
    media: {
      images: [
        {
          url: String,
          publicId: String, // Cloudinary public ID để xóa
          size: Number, // bytes
          width: Number,
          height: Number,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      videos: [
        {
          url: String,
          publicId: String,
          size: Number, // bytes, max 25MB
          duration: Number, // seconds
          thumbnailUrl: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Tags
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Mentions (@username)
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Statistics
    stats: {
      upvotes: {
        type: Number,
        default: 0,
      },
      downvotes: {
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
      sharesCount: {
        type: Number,
        default: 0,
      },
    },

    // Score calculation (for ranking/sorting)
    // Score = (upvotes - downvotes) / (time_decay_factor)
    score: {
      type: Number,
      default: 0,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "published", "pending_approval", "removed", "spam"],
      default: "published",
    },

    // AI Analysis
    aiAnalysis: {
      isToxic: {
        type: Boolean,
        default: false,
      },
      toxicScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      isSpam: {
        type: Boolean,
        default: false,
      },
      spamScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      analyzedAt: Date,
    },

    // Moderation
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false, // Không cho comment nữa
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNSFW: {
      type: Boolean,
      default: false, // Not Safe For Work content
    },
    allowComments: {
      type: Boolean,
      default: true, // Cho phép comments
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    removedReason: String,
    removedAt: Date,

    // Soft Delete (standard pattern)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // Index để query nhanh
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: Date,

    // Tracking
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    editedAt: Date,

    // Edit history
    editHistory: [
      {
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
        changes: String, // Mô tả thay đổi
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual: Score tính theo công thức Reddit
postSchema.virtual("hotScore").get(function () {
  const hoursAge = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  const netVotes = this.stats.upvotes - this.stats.downvotes;

  // Hot score = net_votes / (age + 2)^1.5
  return netVotes / Math.pow(hoursAge + 2, 1.5);
});

// Virtual: Controversial score (nhiều upvote và downvote)
postSchema.virtual("controversialScore").get(function () {
  const total = this.stats.upvotes + this.stats.downvotes;
  if (total === 0) return 0;

  const balance = Math.min(this.stats.upvotes, this.stats.downvotes);
  return balance * total;
});

// Method: Tính và update score
postSchema.methods.updateScore = function () {
  const hoursAge = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  const netVotes = this.stats.upvotes - this.stats.downvotes;

  // Sử dụng công thức hot score
  this.score = netVotes / Math.pow(hoursAge + 2, 1.5);
};

// Method: Tăng view count
postSchema.methods.incrementViews = async function () {
  this.stats.viewsCount += 1;
  await this.save();

  // Cũng tăng views cho author
  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.viewsReceived": 1 } });
};

// Method: Handle upvote
postSchema.methods.addUpvote = async function () {
  this.stats.upvotes += 1;
  this.updateScore();
  await this.save();

  // Tăng upvotes cho author
  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.upvotesReceived": 1 } });
};

// Method: Handle downvote
postSchema.methods.addDownvote = async function () {
  this.stats.downvotes += 1;
  this.updateScore();
  await this.save();

  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.downvotesReceived": 1 } });
};

// Method: Remove vote (undo)
postSchema.methods.removeUpvote = async function () {
  this.stats.upvotes = Math.max(0, this.stats.upvotes - 1);
  this.updateScore();
  await this.save();

  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.upvotesReceived": -1 } });
};

postSchema.methods.removeDownvote = async function () {
  this.stats.downvotes = Math.max(0, this.stats.downvotes - 1);
  this.updateScore();
  await this.save();

  await mongoose.model("User").findByIdAndUpdate(this.author, {
    $inc: { "stats.downvotesReceived": -1 },
  });
};

// Pre-save: Auto generate slug
postSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    const randomStr = Math.random().toString(36).substring(7);
    this.slug =
      this.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .substring(0, 50) +
      "-" +
      randomStr;
  }
  next();
});

// Pre-save: Update score before saving
postSchema.pre("save", function (next) {
  if (this.isModified("stats.upvotes") || this.isModified("stats.downvotes")) {
    this.updateScore();
  }
  next();
});

// Index
postSchema.index({ slug: 1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ score: -1 }); // Hot posts
postSchema.index({ "stats.upvotes": -1 }); // Top posts
postSchema.index({ createdAt: -1 }); // New posts
postSchema.index({ status: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ mentions: 1 }); // Mentions lookup
postSchema.index({ isNSFW: 1 }); // Filter NSFW content
postSchema.index({ "aiAnalysis.isToxic": 1 });
postSchema.index({ "aiAnalysis.isSpam": 1 });

// Text search
postSchema.index({ title: "text", content: "text", tags: "text" });

module.exports = mongoose.model("Post", postSchema);
