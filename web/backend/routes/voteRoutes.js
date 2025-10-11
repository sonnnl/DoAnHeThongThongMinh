/**
 * FILE: web/backend/routes/voteRoutes.js
 * MỤC ĐÍCH: Routes cho voting system
 * LIÊN QUAN:
 *   - web/backend/controllers/voteController.js
 *   - web/backend/models/Vote.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");

// @route   POST /api/votes/upvote
// @desc    Upvote post hoặc comment
// @access  Private
router.post("/upvote", authenticate, (req, res) => {
  res.json({ message: "Upvote - TODO" });
});

// @route   POST /api/votes/downvote
// @desc    Downvote post hoặc comment
// @access  Private
router.post("/downvote", authenticate, (req, res) => {
  res.json({ message: "Downvote - TODO" });
});

// @route   GET /api/votes/my-votes
// @desc    Lấy danh sách votes của user
// @access  Private
router.get("/my-votes", authenticate, (req, res) => {
  res.json({ message: "Get my votes - TODO" });
});

module.exports = router;
