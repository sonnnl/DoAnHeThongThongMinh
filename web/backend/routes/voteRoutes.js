/**
 * FILE: web/backend/routes/voteRoutes.js
 * MỤC ĐÍCH: Routes cho voting (upvote/downvote)
 * LIÊN QUAN:
 *   - web/backend/controllers/voteController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const voteController = require("../controllers/voteController");

// @route   POST /api/votes
// @desc    Vote (upvote/downvote) cho Post hoặc Comment
// @access  Private
router.post("/", authenticate, voteController.vote);

// @route   GET /api/votes/:contentType/:contentId
// @desc    Lấy vote status của user
// @access  Private
router.get(
  "/:contentType/:contentId",
  authenticate,
  voteController.getVoteStatus
);

// @route   GET /api/votes/:contentType/:contentId/upvotes
// @desc    Lấy danh sách users đã upvote
// @access  Public
router.get("/:contentType/:contentId/upvotes", voteController.getUpvoters);

// @route   GET /api/votes/:contentType/:contentId/downvotes
// @desc    Lấy danh sách users đã downvote
// @access  Public
router.get("/:contentType/:contentId/downvotes", voteController.getDownvoters);

module.exports = router;
