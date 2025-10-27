/**
 * FILE: web/backend/controllers/categoryController.js
 * MỤC ĐÍCH: Xử lý các thao tác liên quan đến categories
 * LIÊN QUAN:
 *   - web/backend/models/Category.js
 *   - web/backend/models/CategoryFollow.js
 *   - web/backend/routes/categoryRoutes.js
 * CHỨC NĂNG:
 *   - CRUD categories (Admin only)
 *   - Lấy danh sách categories
 *   - Follow/Unfollow category
 *   - Lấy trending categories
 */

const Category = require("../models/Category");
const CategoryFollow = require("../models/CategoryFollow");
const Post = require("../models/Post");
const slugify = require("slugify");

// @desc    Tạo category mới
// @route   POST /api/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;

    // Tạo slug
    let slug = slugify(name, {
      lower: true,
      strict: true,
      locale: "vi",
      remove: /[*+~.()'"!:@]/g,
    });

    // Kiểm tra slug đã tồn tại chưa
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category với tên này đã tồn tại",
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      color,
      icon,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Tạo category thành công",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy tất cả categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const { sort = "popular" } = req.query;

    let sortQuery = {};
    switch (sort) {
      case "name":
        sortQuery = { name: 1 };
        break;
      case "new":
        sortQuery = { createdAt: -1 };
        break;
      case "posts":
        sortQuery = { "stats.postsCount": -1 };
        break;
      case "popular":
      default:
        sortQuery = { "stats.followersCount": -1, "stats.postsCount": -1 };
        break;
    }

    const categories = await Category.find({ isActive: true })
      .sort(sortQuery)
      .lean();

    // Nếu user đang đăng nhập, check following status
    if (req.user) {
      const categoryIds = categories.map((c) => c._id);
      const follows = await CategoryFollow.find({
        user: req.user.id,
        category: { $in: categoryIds },
      }).lean();

      const followMap = {};
      follows.forEach((f) => {
        followMap[f.category.toString()] = true;
      });

      categories.forEach((category) => {
        category.isFollowing = followMap[category._id.toString()] || false;
      });
    }

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết category
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true })
      .populate("createdBy", "username")
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }

    // Check following status
    if (req.user) {
      const follow = await CategoryFollow.findOne({
        user: req.user.id,
        category: category._id,
      });
      category.isFollowing = !!follow;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật category
// @route   PUT /api/categories/:categoryId
// @access  Private (Admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, description, color, icon, isActive } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }

    // Update fields
    if (name) {
      category.name = name;
      category.slug = slugify(name, {
        lower: true,
        strict: true,
        locale: "vi",
        remove: /[*+~.()'"!:@]/g,
      });
    }
    if (description !== undefined) category.description = description;
    if (color) category.color = color;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật category thành công",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa category
// @route   DELETE /api/categories/:categoryId
// @access  Private (Admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }

    // Kiểm tra có posts trong category không
    const postsCount = await Post.countDocuments({
      category: categoryId,
      isDeleted: false,
    });

    if (postsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa category có ${postsCount} bài viết. Vui lòng di chuyển các bài viết trước.`,
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Xóa category thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow category
// @route   POST /api/categories/:categoryId/follow
// @access  Private
exports.followCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    // Kiểm tra category tồn tại
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }

    // Kiểm tra đã follow chưa
    const existingFollow = await CategoryFollow.findOne({
      user: req.user.id,
      category: categoryId,
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã follow category này rồi",
      });
    }

    // Tạo follow
    await CategoryFollow.create({
      user: req.user.id,
      category: categoryId,
    });

    // Update stats
    category.stats.followersCount += 1;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Follow category thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow category
// @route   DELETE /api/categories/:categoryId/follow
// @access  Private
exports.unfollowCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const follow = await CategoryFollow.findOneAndDelete({
      user: req.user.id,
      category: categoryId,
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: "Bạn chưa follow category này",
      });
    }

    // Update stats
    await Category.findByIdAndUpdate(categoryId, {
      $inc: { "stats.followersCount": -1 },
    });

    res.status(200).json({
      success: true,
      message: "Unfollow category thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách categories user đang follow
// @route   GET /api/categories/following
// @access  Private
exports.getFollowingCategories = async (req, res, next) => {
  try {
    const follows = await CategoryFollow.find({ user: req.user.id })
      .populate("category")
      .lean();

    const categories = follows.map((f) => ({
      ...f.category,
      followedAt: f.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy trending categories
// @route   GET /api/categories/trending
// @access  Public
exports.getTrendingCategories = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Categories có nhiều posts trong 7 ngày qua
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const trendingPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$category",
          postsCount: { $sum: 1 },
          totalScore: { $sum: "$score" },
        },
      },
      { $sort: { postsCount: -1, totalScore: -1 } },
      { $limit: parseInt(limit) },
    ]);

    const categoryIds = trendingPosts.map((t) => t._id);

    const categories = await Category.find({
      _id: { $in: categoryIds },
      isActive: true,
    }).lean();

    // Map thêm trending stats
    const categoryMap = {};
    trendingPosts.forEach((t) => {
      categoryMap[t._id.toString()] = {
        postsCountThisWeek: t.postsCount,
        totalScoreThisWeek: t.totalScore,
      };
    });

    const result = categories.map((c) => ({
      ...c,
      ...categoryMap[c._id.toString()],
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
