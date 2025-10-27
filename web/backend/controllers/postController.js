/**
 * FILE: web/backend/controllers/postController.js
 * MỤC ĐÍCH: Xử lý các thao tác liên quan đến bài viết
 * LIÊN QUAN:
 *   - web/backend/models/Post.js
 *   - web/backend/models/User.js
 *   - web/backend/models/Category.js
 *   - web/backend/routes/postRoutes.js
 * CHỨC NĂNG:
 *   - Tạo bài viết mới
 *   - Lấy danh sách bài viết
 *   - Lấy chi tiết bài viết
 *   - Cập nhật bài viết
 *   - Xóa bài viết
 *   - Tìm kiếm bài viết
 *   - Save/Unsave bài viết
 */

const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const SavedPost = require("../models/SavedPost");
const Vote = require("../models/Vote");
const Comment = require("../models/Comment");
const slugify = require("slugify");

// @desc    Tạo bài viết mới
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, category, mediaFiles, tags } = req.body;

    // Lấy user và kiểm tra quyền post
    const user = await User.findById(req.user.id);
    const canPost = user.canCreatePost();

    if (!canPost.allowed) {
      return res.status(403).json({
        success: false,
        message: canPost.reason,
      });
    }

    // Kiểm tra category tồn tại
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }

    // Tạo slug từ title
    let slug = slugify(title, {
      lower: true,
      strict: true,
      locale: "vi", // Hỗ trợ tiếng Việt
      remove: /[*+~.()'"!:@]/g, // Xóa ký tự đặc biệt
    });

    // Đảm bảo slug là unique
    const existingPost = await Post.findOne({ slug });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    // TODO: Tích hợp AI để kiểm tra spam/toxic content
    // const isSpam = await checkSpam(content);
    // const isToxic = await checkToxic(content);

    // Tạo post
    const post = await Post.create({
      title,
      content,
      slug,
      author: req.user.id,
      category,
      mediaFiles: mediaFiles || [],
      tags: tags || [],
    });

    // Update user stats
    user.stats.postsCount += 1;
    user.updateBadge();
    await user.save();

    // Update category stats
    categoryDoc.stats.postsCount += 1;
    await categoryDoc.save();

    // Populate và return
    await post.populate("author", "username avatar badge");
    await post.populate("category", "name slug");

    res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách bài viết (với filters, sorting)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      sort = "hot",
      tag,
      author,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { isDeleted: false };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (author) {
      query.author = author;
    }

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case "new":
        sortQuery = { createdAt: -1 };
        break;
      case "top":
        sortQuery = { "stats.upvotes": -1 };
        break;
      case "controversial":
        sortQuery = { "stats.downvotes": -1, "stats.upvotes": -1 };
        break;
      case "hot":
      default:
        // Hot = score cao + mới
        sortQuery = { score: -1, createdAt: -1 };
        break;
    }

    const posts = await Post.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "username avatar badge")
      .populate("category", "name slug color")
      .lean();

    const total = await Post.countDocuments(query);

    // Nếu user đang đăng nhập, lấy vote status
    if (req.user) {
      const postIds = posts.map((p) => p._id);
      const votes = await Vote.find({
        user: req.user.id,
        contentType: "Post",
        contentId: { $in: postIds },
      }).lean();

      const voteMap = {};
      votes.forEach((v) => {
        voteMap[v.contentId.toString()] = v.voteType;
      });

      posts.forEach((post) => {
        post.userVote = voteMap[post._id.toString()] || null;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        posts,
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

// @desc    Lấy chi tiết bài viết
// @route   GET /api/posts/:slug
// @access  Public
exports.getPost = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const post = await Post.findOne({ slug, isDeleted: false })
      .populate("author", "username avatar badge stats registeredAt")
      .populate("category", "name slug color description")
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Tăng view count
    await Post.findByIdAndUpdate(post._id, { $inc: { "stats.views": 1 } });

    // Update author view stats
    await User.findByIdAndUpdate(post.author._id, {
      $inc: { "stats.viewsReceived": 1 },
    });

    // Nếu user đang đăng nhập, lấy vote status và saved status
    if (req.user) {
      const vote = await Vote.findOne({
        user: req.user.id,
        contentType: "Post",
        contentId: post._id,
      });

      const saved = await SavedPost.findOne({
        user: req.user.id,
        post: post._id,
      });

      post.userVote = vote ? vote.voteType : null;
      post.isSaved = !!saved;
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật bài viết
// @route   PUT /api/posts/:postId
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, content, tags, mediaFiles } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Kiểm tra quyền sở hữu
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa bài viết này",
      });
    }

    // Kiểm tra thời gian edit (ví dụ: chỉ được edit trong 24h)
    const editWindow = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - post.createdAt.getTime() > editWindow) {
      return res.status(403).json({
        success: false,
        message: "Bài viết chỉ có thể chỉnh sửa trong vòng 24 giờ sau khi đăng",
      });
    }

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;
    if (mediaFiles) post.mediaFiles = mediaFiles;

    post.isEdited = true;
    post.editedAt = Date.now();

    await post.save();

    await post.populate("author", "username avatar badge");
    await post.populate("category", "name slug color");

    res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công",
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa bài viết
// @route   DELETE /api/posts/:postId
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Kiểm tra quyền (owner hoặc admin/moderator)
    const user = await User.findById(req.user.id);
    if (
      post.author.toString() !== req.user.id &&
      user.role !== "admin" &&
      user.role !== "moderator"
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bài viết này",
      });
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    // Update user stats
    await User.findByIdAndUpdate(post.author, {
      $inc: { "stats.postsCount": -1 },
    });

    // Update category stats
    await Category.findByIdAndUpdate(post.category, {
      $inc: { "stats.postsCount": -1 },
    });

    res.status(200).json({
      success: true,
      message: "Xóa bài viết thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tìm kiếm bài viết
// @route   GET /api/posts/search
// @access  Public
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20, category } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp từ khóa tìm kiếm",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      isDeleted: false,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    };

    if (category) {
      query.category = category;
    }

    const posts = await Post.find(query)
      .sort({ score: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("author", "username avatar badge")
      .populate("category", "name slug color")
      .lean();

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        posts,
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

// @desc    Save bài viết
// @route   POST /api/posts/:postId/save
// @access  Private
exports.savePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết",
      });
    }

    // Kiểm tra đã save chưa
    const existing = await SavedPost.findOne({
      user: req.user.id,
      post: postId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bài viết đã được lưu",
      });
    }

    await SavedPost.create({
      user: req.user.id,
      post: postId,
    });

    res.status(200).json({
      success: true,
      message: "Lưu bài viết thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsave bài viết
// @route   DELETE /api/posts/:postId/save
// @access  Private
exports.unsavePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const result = await SavedPost.findOneAndDelete({
      user: req.user.id,
      post: postId,
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        message: "Bài viết chưa được lưu",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bỏ lưu bài viết thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách bài viết đã lưu
// @route   GET /api/posts/saved
// @access  Private
exports.getSavedPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const savedPosts = await SavedPost.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "post",
        populate: [
          { path: "author", select: "username avatar badge" },
          { path: "category", select: "name slug color" },
        ],
      })
      .lean();

    const total = await SavedPost.countDocuments({ user: req.user.id });

    const posts = savedPosts
      .map((sp) => sp.post)
      .filter((p) => p && !p.isDeleted);

    res.status(200).json({
      success: true,
      data: {
        posts,
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

// @desc    Lấy trending posts (hot trong tuần)
// @route   GET /api/posts/trending
// @access  Public
exports.getTrendingPosts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Posts trong 7 ngày qua, sort theo score
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      isDeleted: false,
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ score: -1, "stats.views": -1 })
      .limit(parseInt(limit))
      .populate("author", "username avatar badge")
      .populate("category", "name slug color")
      .lean();

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};
