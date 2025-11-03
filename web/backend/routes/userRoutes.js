/**
 * FILE: web/backend/routes/userRoutes.js
 * MỤC ĐÍCH: Routes cho user management
 * LIÊN QUAN:
 *   - web/backend/controllers/userController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, optionalAuth, isModerator } = require("../middleware/auth");
const userController = require("../controllers/userController");

// @route   GET /api/users/search
// @desc    Tìm kiếm users
// @access  Public
router.get("/search", userController.searchUsers);


// @route   PUT /api/users/profile
// @desc    Update profile
// @access  Private
router.put("/profile", authenticate, userController.updateProfile);

// @route   PUT /api/users/change-password
// @desc    Đổi mật khẩu
// @access  Private
router.put("/change-password", authenticate, userController.changePassword);

// @route   POST /api/users/:userId/follow
// @desc    Follow user
// @access  Private
router.post("/:userId/follow", authenticate, userController.followUser);

// @route   DELETE /api/users/:userId/follow
// @desc    Unfollow user
// @access  Private
router.delete("/:userId/follow", authenticate, userController.unfollowUser);

// @route   GET /api/users/:userId/followers
// @desc    Lấy danh sách followers
// @access  Public
router.get("/:userId/followers", userController.getFollowers);

// @route   GET /api/users/:userId/following
// @desc    Lấy danh sách following
// @access  Public
router.get("/:userId/following", userController.getFollowing);

// @route   POST /api/users/:userId/block
// @desc    Block user
// @access  Private
router.post("/:userId/block", authenticate, userController.blockUser);

// @route   DELETE /api/users/:userId/block
// @desc    Unblock user
// @access  Private
router.delete("/:userId/block", authenticate, userController.unblockUser);

// @route   GET /api/users/:userId/posts
// @desc    Lấy posts của user
// @access  Public
router.get("/:userId/posts", userController.getUserPosts);

// @route   GET /api/users/:userId/comments
// @desc    Lấy comments của user
// @access  Public
router.get("/:userId/comments", userController.getUserComments);

// @route   PUT /api/users/preferences
// @desc    Update preferences
// @access  Private
router.put("/preferences", authenticate, userController.updatePreferences);

// ===== Admin APIs =====
router.get("/admin", authenticate, isModerator, userController.adminListUsers);
router.put(
  "/admin/:userId/role",
  authenticate,
  isModerator,
  userController.adminUpdateRole
);
router.post(
  "/admin/:userId/ban",
  authenticate,
  isModerator,
  userController.adminBanUser
);
router.post(
  "/admin/:userId/unban",
  authenticate,
  isModerator,
  userController.adminUnbanUser
);
router.put(
  "/admin/:userId/restrictions",
  authenticate,
  isModerator,
  userController.adminSetRestrictions
);

// Đặt route này CUỐI CÙNG để tránh nuốt mất các route khác (như /admin)
// @route   GET /api/users/:username
// @desc    Lấy profile user theo username
// @access  Public
router.get("/:username", optionalAuth, userController.getUserProfile);

module.exports = router;
