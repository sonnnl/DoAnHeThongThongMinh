/**
 * FILE: web/backend/routes/postRoutes.js
 * MỤC ĐÍCH: Routes cho posts
 * LIÊN QUAN:
 *   - web/backend/controllers/postController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, optionalAuth } = require("../middleware/auth");
const postController = require("../controllers/postController");

// @route   GET /api/posts/search
// @desc    Tìm kiếm posts
// @access  Public
router.get("/search", postController.searchPosts);

// @route   GET /api/posts/trending
// @desc    Lấy trending posts
// @access  Public
router.get("/trending", postController.getTrendingPosts);

// @route   GET /api/posts/saved
// @desc    Lấy saved posts
// @access  Private
router.get("/saved", authenticate, postController.getSavedPosts);

// @route   GET /api/posts
// @desc    Lấy danh sách posts (hot, new, top)
// @access  Public
router.get("/", optionalAuth, postController.getPosts);

// @route   POST /api/posts
// @desc    Tạo post mới
// @access  Private
router.post("/", authenticate, postController.createPost);

// @route   GET /api/posts/:slug
// @desc    Lấy chi tiết post
// @access  Public (with optional auth for vote status)
router.get("/:slug", optionalAuth, postController.getPost);

// @route   PUT /api/posts/:postId
// @desc    Update post
// @access  Private (author only)
router.put("/:postId", authenticate, postController.updatePost);

// @route   DELETE /api/posts/:postId
// @desc    Xóa post
// @access  Private (author only)
router.delete("/:postId", authenticate, postController.deletePost);

// @route   POST /api/posts/:postId/save
// @desc    Save post
// @access  Private
router.post("/:postId/save", authenticate, postController.savePost);

// @route   DELETE /api/posts/:postId/save
// @desc    Unsave post
// @access  Private
router.delete("/:postId/save", authenticate, postController.unsavePost);

module.exports = router;
