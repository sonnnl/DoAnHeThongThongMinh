/**
 * FILE: web/backend/routes/reportRoutes.js
 * MỤC ĐÍCH: Routes cho reports
 * LIÊN QUAN:
 *   - web/backend/controllers/reportController.js
 *   - web/backend/middleware/auth.js
 */

const express = require("express");
const router = express.Router();

const { authenticate, isModerator } = require("../middleware/auth");
const reportController = require("../controllers/reportController");

// @route   GET /api/reports/my-reports
// @desc    Lấy reports của user hiện tại
// @access  Private
router.get("/my-reports", authenticate, reportController.getMyReports);

// @route   GET /api/reports/stats
// @desc    Lấy thống kê reports
// @access  Private (Moderator/Admin)
router.get(
  "/stats",
  authenticate,
  isModerator,
  reportController.getReportStats
);

// @route   POST /api/reports
// @desc    Tạo report mới
// @access  Private
router.post("/", authenticate, reportController.createReport);

// @route   GET /api/reports
// @desc    Lấy danh sách reports
// @access  Private (Moderator/Admin)
router.get("/", authenticate, isModerator, reportController.getReports);

// @route   GET /api/reports/:reportId
// @desc    Lấy chi tiết report
// @access  Private (Moderator/Admin)
router.get("/:reportId", authenticate, isModerator, reportController.getReport);

// @route   PUT /api/reports/:reportId
// @desc    Review report (accept/reject)
// @access  Private (Moderator/Admin)
router.put(
  "/:reportId",
  authenticate,
  isModerator,
  reportController.reviewReport
);

module.exports = router;
