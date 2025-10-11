/**
 * FILE: web/backend/routes/reportRoutes.js
 * MỤC ĐÍCH: Routes cho report system
 * LIÊN QUAN:
 *   - web/backend/controllers/reportController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, isModerator } = require("../middleware/auth");
const {
  validateCreateReport,
  validateMongoId,
  validatePagination,
} = require("../middleware/validate");

// @route   GET /api/reports
// @desc    Lấy danh sách reports (moderator)
// @access  Private (Moderator)
router.get("/", authenticate, isModerator, validatePagination, (req, res) => {
  res.json({ message: "Get reports - TODO" });
});

// @route   POST /api/reports
// @desc    Tạo report mới
// @access  Private
router.post("/", authenticate, validateCreateReport, (req, res) => {
  res.json({ message: "Create report - TODO" });
});

// @route   PUT /api/reports/:id/accept
// @desc    Accept report và thực hiện action
// @access  Private (Moderator)
router.put(
  "/:id/accept",
  authenticate,
  isModerator,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Accept report - TODO" });
  }
);

// @route   PUT /api/reports/:id/reject
// @desc    Reject report
// @access  Private (Moderator)
router.put(
  "/:id/reject",
  authenticate,
  isModerator,
  validateMongoId("id"),
  (req, res) => {
    res.json({ message: "Reject report - TODO" });
  }
);

module.exports = router;
