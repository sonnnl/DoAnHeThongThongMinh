/**
 * FILE: web/backend/controllers/commentController.js
 * MỤC ĐÍCH: Xử lý các thao tác liên quan đến comments
 * LIÊN QUAN:
 *   - web/backend/models/Comment.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/User.js
 *   - web/backend/routes/commentRoutes.js
 * CHỨC NĂNG:
 *   - Tạo comment
 *   - Reply comment
 *   - Lấy danh sách comments
 *   - Cập nhật comment
 *   - Xóa comment
 *   - Có thể attach ảnh vào comment
 */

const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const Vote = require("../models/Vote");

// @desc    Tạo comment mới
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    const { postId, content, parentComment, mediaUrl } = req.body;

    // Kiểm tra user có quyền comment không
    const user = await User.findById(req.user.id);
    const canComment = user.canCreateComment();

    if (!canComment.allowed) {
      return res.status(403).json({
        success: false,
        message: canComment.reason,
      });
    }

    // Kiểm tra post tồn tại
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Nếu là reply, kiểm tra parent comment
    let depth = 0;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy comment gốc",
        });
      }
      depth = parent.depth + 1;
    }

    // TODO: Tích hợp AI để phân tích cảm xúc và toxic
    // const emotion = await detectEmotion(content);
    // const isToxic = await checkToxic(content);

    // Tạo comment
    const comment = await Comment.create({
      post: postId,
      author: req.user.id,
      content,
      parentComment: parentComment || null,
      depth,
      mediaUrl: mediaUrl || null,
      // emotion: emotion,
      // isToxic: isToxic,
    });

    // Update post stats
    post.stats.commentsCount += 1;
    await post.save();

    // Update user stats
    user.stats.commentsCount += 1;

    // Kiểm tra và unlock post permission nếu đủ 3 comments
    if (user.stats.commentsCount >= 3) {
      user.restrictions.canPost = true;
    }

    user.updateBadge();
    await user.save();

    // Populate và return
    await comment.populate("author", "username avatar badge");

    res.status(201).json({
      success: true,
      message: "Tạo comment thành công",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy comments của bài viết
// @route   GET /api/comments/post/:postId
// @access  Public
exports.getCommentsByPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const {
      page = 1,
      limit = 50,
      sort = "best",
      parentComment = null,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {
      post: postId,
      isDeleted: false,
      parentComment: parentComment || null,
    };

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case "new":
        sortQuery = { createdAt: -1 };
        break;
      case "old":
        sortQuery = { createdAt: 1 };
        break;
      case "top":
        sortQuery = { "stats.upvotes": -1 };
        break;
      case "best":
      default:
        sortQuery = { score: -1, createdAt: -1 };
        break;
    }

    const comments = await Comment.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "username avatar badge")
      .lean();

    const total = await Comment.countDocuments(query);

    // Lấy số lượng replies cho mỗi comment
    for (let comment of comments) {
      comment.repliesCount = await Comment.countDocuments({
        parentComment: comment._id,
        isDeleted: false,
      });

      // Nếu user đang đăng nhập, lấy vote status
      if (req.user) {
        const vote = await Vote.findOne({
          user: req.user.id,
          contentType: "Comment",
          contentId: comment._id,
        });
        comment.userVote = vote ? vote.voteType : null;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        comments,
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

// @desc    Lấy replies của comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
exports.getCommentReplies = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20, sort = "best" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortQuery = {};
    switch (sort) {
      case "new":
        sortQuery = { createdAt: -1 };
        break;
      case "old":
        sortQuery = { createdAt: 1 };
        break;
      case "best":
      default:
        sortQuery = { score: -1, createdAt: -1 };
        break;
    }

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
    })
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "username avatar badge")
      .lean();

    const total = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false,
    });

    // Nếu user đang đăng nhập, lấy vote status
    if (req.user) {
      for (let reply of replies) {
        const vote = await Vote.findOne({
          user: req.user.id,
          contentType: "Comment",
          contentId: reply._id,
        });
        reply.userVote = vote ? vote.voteType : null;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        replies,
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

// @desc    Cập nhật comment
// @route   PUT /api/comments/:commentId
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content, mediaUrl } = req.body;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy comment",
      });
    }

    // Kiểm tra quyền sở hữu
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa comment này",
      });
    }

    // Update
    if (content) comment.content = content;
    if (mediaUrl !== undefined) comment.mediaUrl = mediaUrl;

    comment.isEdited = true;
    comment.editedAt = Date.now();

    await comment.save();

    await comment.populate("author", "username avatar badge");

    res.status(200).json({
      success: true,
      message: "Cập nhật comment thành công",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa comment
// @route   DELETE /api/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy comment",
      });
    }

    // Kiểm tra quyền (owner hoặc admin/moderator)
    const user = await User.findById(req.user.id);
    if (
      comment.author.toString() !== req.user.id &&
      user.role !== "admin" &&
      user.role !== "moderator"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa comment này",
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = "[Comment đã bị xóa]";
    await comment.save();

    // Update post stats
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { "stats.commentsCount": -1 },
    });

    // Update user stats
    await User.findByIdAndUpdate(comment.author, {
      $inc: { "stats.commentsCount": -1 },
    });

    res.status(200).json({
      success: true,
      message: "Xóa comment thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết comment
// @route   GET /api/comments/:commentId
// @access  Public
exports.getComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId)
      .populate("author", "username avatar badge stats")
      .populate("post", "title slug")
      .lean();

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy comment",
      });
    }

    // Lấy parent comment nếu có
    if (comment.parentComment) {
      const parent = await Comment.findById(comment.parentComment)
        .populate("author", "username avatar badge")
        .lean();

      comment.parentCommentData = parent;
    }

    // Nếu user đang đăng nhập, lấy vote status
    if (req.user) {
      const vote = await Vote.findOne({
        user: req.user.id,
        contentType: "Comment",
        contentId: comment._id,
      });
      comment.userVote = vote ? vote.voteType : null;
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};
