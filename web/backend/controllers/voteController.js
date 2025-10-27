/**
 * FILE: web/backend/controllers/voteController.js
 * MỤC ĐÍCH: Xử lý upvote/downvote cho posts và comments
 * LIÊN QUAN:
 *   - web/backend/models/Vote.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 *   - web/backend/routes/voteRoutes.js
 * CHỨC NĂNG:
 *   - Upvote/Downvote post hoặc comment
 *   - Remove vote
 *   - Tự động cập nhật score và stats
 */

const Vote = require("../models/Vote");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");

// @desc    Vote cho content (Post hoặc Comment)
// @route   POST /api/votes
// @access  Private
exports.vote = async (req, res, next) => {
  try {
    const { contentType, contentId, voteType } = req.body;

    // Validate contentType
    if (!["Post", "Comment"].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: "contentType phải là Post hoặc Comment",
      });
    }

    // Validate voteType
    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "voteType phải là upvote hoặc downvote",
      });
    }

    // Kiểm tra content tồn tại
    let content;
    let Model = contentType === "Post" ? Post : Comment;

    content = await Model.findById(contentId);

    if (!content || content.isDeleted) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy ${contentType}`,
      });
    }

    // Không thể vote cho chính mình
    if (content.author.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Không thể vote cho nội dung của chính mình",
      });
    }

    // Kiểm tra vote hiện tại
    let existingVote = await Vote.findOne({
      user: req.user.id,
      contentType,
      contentId,
    });

    const user = await User.findById(req.user.id);
    const contentAuthor = await User.findById(content.author);

    if (existingVote) {
      // Nếu vote giống với vote cũ -> remove vote
      if (existingVote.voteType === voteType) {
        // Revert stats
        if (voteType === "upvote") {
          content.stats.upvotes -= 1;
          user.stats.upvotesGiven -= 1;
          contentAuthor.stats.upvotesReceived -= 1;
        } else {
          content.stats.downvotes -= 1;
          user.stats.downvotesGiven -= 1;
          contentAuthor.stats.downvotesReceived -= 1;
        }

        await existingVote.deleteOne();
      } else {
        // Change vote
        const oldVote = existingVote.voteType;

        // Revert old vote stats
        if (oldVote === "upvote") {
          content.stats.upvotes -= 1;
          user.stats.upvotesGiven -= 1;
          contentAuthor.stats.upvotesReceived -= 1;
        } else {
          content.stats.downvotes -= 1;
          user.stats.downvotesGiven -= 1;
          contentAuthor.stats.downvotesReceived -= 1;
        }

        // Apply new vote stats
        if (voteType === "upvote") {
          content.stats.upvotes += 1;
          user.stats.upvotesGiven += 1;
          contentAuthor.stats.upvotesReceived += 1;
        } else {
          content.stats.downvotes += 1;
          user.stats.downvotesGiven += 1;
          contentAuthor.stats.downvotesReceived += 1;
        }

        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      // Tạo vote mới
      await Vote.create({
        user: req.user.id,
        contentType,
        contentId,
        voteType,
      });

      // Update stats
      if (voteType === "upvote") {
        content.stats.upvotes += 1;
        user.stats.upvotesGiven += 1;
        contentAuthor.stats.upvotesReceived += 1;
      } else {
        content.stats.downvotes += 1;
        user.stats.downvotesGiven += 1;
        contentAuthor.stats.downvotesReceived += 1;
      }
    }

    // Update score
    content.score = content.stats.upvotes - content.stats.downvotes;
    await content.save();

    // Update author badge
    contentAuthor.updateBadge();
    await contentAuthor.save();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Vote thành công",
      data: {
        upvotes: content.stats.upvotes,
        downvotes: content.stats.downvotes,
        score: content.score,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy vote status của user cho một content
// @route   GET /api/votes/:contentType/:contentId
// @access  Private
exports.getVoteStatus = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;

    const vote = await Vote.findOne({
      user: req.user.id,
      contentType,
      contentId,
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        voteType: vote ? vote.voteType : null,
        votedAt: vote ? vote.createdAt : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách users đã upvote
// @route   GET /api/votes/:contentType/:contentId/upvotes
// @access  Public
exports.getUpvoters = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const votes = await Vote.find({
      contentType,
      contentId,
      voteType: "upvote",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username avatar badge")
      .lean();

    const total = await Vote.countDocuments({
      contentType,
      contentId,
      voteType: "upvote",
    });

    res.status(200).json({
      success: true,
      data: {
        users: votes.map((v) => v.user),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách users đã downvote
// @route   GET /api/votes/:contentType/:contentId/downvotes
// @access  Public
exports.getDownvoters = async (req, res, next) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const votes = await Vote.find({
      contentType,
      contentId,
      voteType: "downvote",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username avatar badge")
      .lean();

    const total = await Vote.countDocuments({
      contentType,
      contentId,
      voteType: "downvote",
    });

    res.status(200).json({
      success: true,
      data: {
        users: votes.map((v) => v.user),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
