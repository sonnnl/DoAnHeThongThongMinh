/**
 * FILE: web/backend/models/Comment.js
 * MỤC ĐÍCH: Schema MongoDB cho Comment model
 * LIÊN QUAN:
 *   - web/backend/controllers/commentController.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/User.js
 *   - web/backend/models/Vote.js
 *   - ai/emotions/predict.py
 *   - ai/toxic_detection/predict.py
 * CHỨC NĂNG:
 *   - Quản lý comments và replies (nested comments)
 *   - Hỗ trợ ảnh trong comment
 *   - Chỉnh sửa, xóa comment (soft delete)
 *   - Phát hiện cảm xúc bằng AI
 *   - Upvote/downvote comments
 *   - Hiển thị "Bình luận này đã bị xóa" khi có reply
 */

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // Nội dung
    content: {
      type: String,
      required: function () {
        return !this.isDeleted; // Content không bắt buộc nếu đã xóa
      },
      maxlength: 10000,
    },

    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Post mà comment này thuộc về
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    // Parent comment (for nested replies)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    // Depth level (0 = top level, 1 = reply to top level, etc.)
    depth: {
      type: Number,
      default: 0,
      max: 10, // Giới hạn độ sâu để tránh quá nhiều nested
    },

    // Media - Hỗ trợ ảnh trong comment
    images: [
      {
        url: String,
        publicId: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
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
      repliesCount: {
        type: Number,
        default: 0,
      },
    },

    // Score (for sorting)
    score: {
      type: Number,
      default: 0,
    },

    // AI Analysis - Phát hiện cảm xúc
    emotion: {
      label: {
        type: String,
        enum: [
          "joy",
          "sadness",
          "anger",
          "fear",
          "surprise",
          "neutral",
          "love",
          "disgust",
        ],
        default: "neutral",
      },
      confidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      analyzedAt: Date,
    },

    // AI Analysis - Toxic detection
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
      analyzedAt: Date,
    },

    // Status
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Nếu đã xóa nhưng vẫn có replies thì hiển thị message này
    deletedMessage: {
      type: String,
      default: "[Bình luận này đã bị xóa]",
    },

    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Moderation
    isRemoved: {
      type: Boolean,
      default: false,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    removedReason: String,
    removedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Virtual: Net votes
commentSchema.virtual("netVotes").get(function () {
  return this.stats.upvotes - this.stats.downvotes;
});

// Virtual: Lấy tất cả replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
});

// Method: Tính score
commentSchema.methods.updateScore = function () {
  const netVotes = this.stats.upvotes - this.stats.downvotes;
  const hoursAge = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);

  // Wilson score interval (Reddit's Best sorting)
  if (this.stats.upvotes + this.stats.downvotes === 0) {
    this.score = 0;
  } else {
    const n = this.stats.upvotes + this.stats.downvotes;
    const p = this.stats.upvotes / n;

    // Simplified Wilson score
    this.score = p - 1.65 * Math.sqrt((p * (1 - p)) / n);
  }
};

// Method: Xóa comment (soft delete)
commentSchema.methods.softDelete = async function (deletedBy) {
  // Kiểm tra có replies không
  const repliesCount = await mongoose.model("Comment").countDocuments({
    parentComment: this._id,
  });

  if (repliesCount > 0) {
    // Có replies -> chỉ ẩn content, giữ lại structure
    this.isDeleted = true;
    this.content = "";
    this.images = [];
    this.deletedMessage = "[Bình luận này đã bị xóa]";
  } else {
    // Không có replies -> xóa hẳn (hard delete sẽ làm ở controller)
    this.isDeleted = true;
    this.content = "";
    this.images = [];
  }

  this.deletedAt = Date.now();
  this.deletedBy = deletedBy;

  await this.save();

  // Giảm comments count của post
  await mongoose.model("Post").findByIdAndUpdate(this.post, {
    $inc: { "stats.commentsCount": -1 },
    $set: { lastActivityAt: Date.now() },
  });

  // Giảm comments count của author
  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.commentsCount": -1 } });

  // Nếu là reply, giảm repliesCount của parent
  if (this.parentComment) {
    await mongoose
      .model("Comment")
      .findByIdAndUpdate(this.parentComment, {
        $inc: { "stats.repliesCount": -1 },
      });
  }
};

// Method: Handle upvote
commentSchema.methods.addUpvote = async function () {
  this.stats.upvotes += 1;
  this.updateScore();
  await this.save();

  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.upvotesReceived": 1 } });
};

// Method: Handle downvote
commentSchema.methods.addDownvote = async function () {
  this.stats.downvotes += 1;
  this.updateScore();
  await this.save();

  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.downvotesReceived": 1 } });
};

// Method: Remove vote
commentSchema.methods.removeUpvote = async function () {
  this.stats.upvotes = Math.max(0, this.stats.upvotes - 1);
  this.updateScore();
  await this.save();

  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, { $inc: { "stats.upvotesReceived": -1 } });
};

commentSchema.methods.removeDownvote = async function () {
  this.stats.downvotes = Math.max(0, this.stats.downvotes - 1);
  this.updateScore();
  await this.save();

  await mongoose
    .model("User")
    .findByIdAndUpdate(this.author, {
      $inc: { "stats.downvotesReceived": -1 },
    });
};

// Method: Phân tích cảm xúc (sẽ gọi AI service)
commentSchema.methods.analyzeEmotion = async function () {
  // TODO: Call AI service
  // const result = await emotionAnalysisService.predict(this.content);
  // this.emotion.label = result.emotion;
  // this.emotion.confidence = result.confidence;
  // this.emotion.analyzedAt = Date.now();
  // await this.save();
};

// Pre-save: Update score
commentSchema.pre("save", function (next) {
  if (this.isModified("stats.upvotes") || this.isModified("stats.downvotes")) {
    this.updateScore();
  }
  next();
});

// Index
commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ score: -1 });
commentSchema.index({ "stats.upvotes": -1 });
commentSchema.index({ isDeleted: 1 });
commentSchema.index({ "emotion.label": 1 });

module.exports = mongoose.model("Comment", commentSchema);
