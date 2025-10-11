/**
 * FILE: web/backend/models/Vote.js
 * MỤC ĐÍCH: Schema MongoDB cho Vote model
 * LIÊN QUAN:
 *   - web/backend/controllers/voteController.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 *   - web/backend/models/User.js
 * CHỨC NĂNG:
 *   - Theo dõi upvote/downvote của user cho posts và comments
 *   - Ngăn chặn duplicate votes
 *   - Hỗ trợ change vote (upvote -> downvote và ngược lại)
 *   - Tracking vote history
 */

const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    // User thực hiện vote
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Target type (post hoặc comment)
    targetType: {
      type: String,
      enum: ["Post", "Comment"],
      required: true,
    },

    // Target ID (post ID hoặc comment ID)
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },

    // Vote type
    voteType: {
      type: String,
      enum: ["upvote", "downvote"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Composite unique index: Một user chỉ vote 1 lần cho 1 target
voteSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Index cho queries
voteSchema.index({ user: 1, createdAt: -1 });
voteSchema.index({ targetType: 1, targetId: 1 });

// Static method: Upvote
voteSchema.statics.upvote = async function (userId, targetType, targetId) {
  const Vote = this;
  const TargetModel = mongoose.model(targetType);

  // Tìm vote hiện tại
  const existingVote = await Vote.findOne({
    user: userId,
    targetType,
    targetId,
  });

  if (existingVote) {
    if (existingVote.voteType === "upvote") {
      // Đã upvote rồi -> remove upvote
      await existingVote.deleteOne();

      const target = await TargetModel.findById(targetId);
      if (target) {
        await target.removeUpvote();
      }

      // Update user stats
      await mongoose
        .model("User")
        .findByIdAndUpdate(userId, { $inc: { "stats.upvotesGiven": -1 } });

      return { action: "removed", voteType: "upvote" };
    } else {
      // Đang downvote -> change to upvote
      existingVote.voteType = "upvote";
      await existingVote.save();

      const target = await TargetModel.findById(targetId);
      if (target) {
        await target.removeDownvote();
        await target.addUpvote();
      }

      // Update user stats
      await mongoose.model("User").findByIdAndUpdate(userId, {
        $inc: {
          "stats.downvotesGiven": -1,
          "stats.upvotesGiven": 1,
        },
      });

      return {
        action: "changed",
        voteType: "upvote",
        previousType: "downvote",
      };
    }
  } else {
    // Chưa vote -> tạo upvote mới
    const newVote = await Vote.create({
      user: userId,
      targetType,
      targetId,
      voteType: "upvote",
    });

    const target = await TargetModel.findById(targetId);
    if (target) {
      await target.addUpvote();
    }

    // Update user stats
    await mongoose
      .model("User")
      .findByIdAndUpdate(userId, { $inc: { "stats.upvotesGiven": 1 } });

    return { action: "created", voteType: "upvote" };
  }
};

// Static method: Downvote
voteSchema.statics.downvote = async function (userId, targetType, targetId) {
  const Vote = this;
  const TargetModel = mongoose.model(targetType);

  const existingVote = await Vote.findOne({
    user: userId,
    targetType,
    targetId,
  });

  if (existingVote) {
    if (existingVote.voteType === "downvote") {
      // Đã downvote rồi -> remove downvote
      await existingVote.deleteOne();

      const target = await TargetModel.findById(targetId);
      if (target) {
        await target.removeDownvote();
      }

      await mongoose
        .model("User")
        .findByIdAndUpdate(userId, { $inc: { "stats.downvotesGiven": -1 } });

      return { action: "removed", voteType: "downvote" };
    } else {
      // Đang upvote -> change to downvote
      existingVote.voteType = "downvote";
      await existingVote.save();

      const target = await TargetModel.findById(targetId);
      if (target) {
        await target.removeUpvote();
        await target.addDownvote();
      }

      await mongoose.model("User").findByIdAndUpdate(userId, {
        $inc: {
          "stats.upvotesGiven": -1,
          "stats.downvotesGiven": 1,
        },
      });

      return {
        action: "changed",
        voteType: "downvote",
        previousType: "upvote",
      };
    }
  } else {
    // Chưa vote -> tạo downvote mới
    const newVote = await Vote.create({
      user: userId,
      targetType,
      targetId,
      voteType: "downvote",
    });

    const target = await TargetModel.findById(targetId);
    if (target) {
      await target.addDownvote();
    }

    await mongoose
      .model("User")
      .findByIdAndUpdate(userId, { $inc: { "stats.downvotesGiven": 1 } });

    return { action: "created", voteType: "downvote" };
  }
};

// Static method: Get user's vote for target
voteSchema.statics.getUserVote = async function (userId, targetType, targetId) {
  const vote = await this.findOne({ user: userId, targetType, targetId });
  return vote ? vote.voteType : null;
};

module.exports = mongoose.model("Vote", voteSchema);
