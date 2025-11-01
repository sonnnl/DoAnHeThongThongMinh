/**
 * FILE: web/backend/controllers/userController.js
 * MỤC ĐÍCH: Xử lý các thao tác liên quan đến user profile
 * LIÊN QUAN:
 *   - web/backend/models/User.js
 *   - web/backend/models/UserFollow.js
 *   - web/backend/routes/userRoutes.js
 * CHỨC NĂNG:
 *   - Lấy thông tin profile user
 *   - Cập nhật profile
 *   - Follow/Unfollow user
 *   - Block/Unblock user
 *   - Lấy danh sách followers/following
 *   - Update preferences
 */

const User = require("../models/User");
const UserFollow = require("../models/UserFollow");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

// @desc    Lấy profile user theo username
// @route   GET /api/users/:username
// @access  Public
exports.getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username })
      .select("-password -resetPasswordToken -verificationToken -blockedUsers")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Nếu có user đang đăng nhập, kiểm tra following status
    let isFollowing = false;
    let isBlocked = false;

    if (req.user) {
      const follow = await UserFollow.findOne({
        follower: req.user.id,
        following: user._id,
      });
      isFollowing = !!follow;

      const currentUser = await User.findById(req.user.id);
      isBlocked = currentUser.isBlocked(user._id);
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        isFollowing,
        isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, location, website, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Nếu đổi username, validate và kiểm tra duplicate
    if (username !== undefined && username !== user.username) {
      // Validate format: chỉ cho phép chữ, số, underscore
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          message: "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
        });
      }

      // Validate length
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Username phải từ 3 đến 30 ký tự",
        });
      }

      // Kiểm tra username đã tồn tại chưa
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: "Username đã được sử dụng",
        });
      }

      user.username = username;
    }

    // Update các fields
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật profile thành công",
      data: user,
    });
  } catch (error) {
    // Handle duplicate key error (nếu có race condition)
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(400).json({
        success: false,
        message: "Username đã được sử dụng",
      });
    }
    next(error);
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Kiểm tra current password
    const isCorrect = await user.comparePassword(currentPassword);

    if (!isCorrect) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow user
// @route   POST /api/users/:userId/follow
// @access  Private
exports.followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Không thể follow chính mình
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Không thể follow chính mình",
      });
    }

    // Kiểm tra user tồn tại
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Kiểm tra đã follow chưa
    const existingFollow = await UserFollow.findOne({
      follower: req.user.id,
      following: userId,
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã follow user này rồi",
      });
    }

    // Tạo follow
    await UserFollow.create({
      follower: req.user.id,
      following: userId,
    });

    // Update stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "stats.followingCount": 1 },
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.followersCount": 1 },
    });

    // TODO: Tạo notification cho user được follow

    res.status(200).json({
      success: true,
      message: "Follow thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/:userId/follow
// @access  Private
exports.unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const follow = await UserFollow.findOneAndDelete({
      follower: req.user.id,
      following: userId,
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: "Bạn chưa follow user này",
      });
    }

    // Update stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "stats.followingCount": -1 },
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.followersCount": -1 },
    });

    res.status(200).json({
      success: true,
      message: "Unfollow thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách followers
// @route   GET /api/users/:userId/followers
// @access  Public
exports.getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const followers = await UserFollow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("follower", "username avatar badge stats")
      .lean();

    const total = await UserFollow.countDocuments({ following: userId });

    res.status(200).json({
      success: true,
      data: {
        followers: followers.map((f) => f.follower),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách following
// @route   GET /api/users/:userId/following
// @access  Public
exports.getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const following = await UserFollow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("following", "username avatar badge stats")
      .lean();

    const total = await UserFollow.countDocuments({ follower: userId });

    res.status(200).json({
      success: true,
      data: {
        following: following.map((f) => f.following),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block user
// @route   POST /api/users/:userId/block
// @access  Private
exports.blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Không thể block chính mình",
      });
    }

    const user = await User.findById(req.user.id);
    await user.blockUser(userId);

    // Unfollow nếu đang follow
    await UserFollow.findOneAndDelete({
      follower: req.user.id,
      following: userId,
    });

    await UserFollow.findOneAndDelete({
      follower: userId,
      following: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Block user thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock user
// @route   DELETE /api/users/:userId/block
// @access  Private
exports.unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.user.id);
    await user.unblockUser(userId);

    res.status(200).json({
      success: true,
      message: "Unblock user thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách posts của user
// @route   GET /api/users/:userId/posts
// @access  Public
exports.getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatar badge")
      .populate("category", "name slug")
      .lean();

    const total = await Post.countDocuments({
      author: userId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách comments của user
// @route   GET /api/users/:userId/comments
// @access  Public
exports.getUserComments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ author: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatar badge")
      .populate("post", "title slug")
      .lean();

    const total = await Comment.countDocuments({
      author: userId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    // Update preferences
    Object.keys(req.body).forEach((key) => {
      if (user.preferences[key] !== undefined) {
        user.preferences[key] = req.body[key];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật preferences thành công",
      data: user.preferences,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tìm kiếm users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp query tìm kiếm",
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("username avatar badge stats registeredAt")
      .sort({ "stats.upvotesReceived": -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
