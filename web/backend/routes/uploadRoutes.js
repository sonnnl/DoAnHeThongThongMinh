/**
 * FILE: web/backend/routes/uploadRoutes.js
 * MỤC ĐÍCH: Routes cho upload files
 * LIÊN QUAN:
 *   - web/backend/controllers/uploadController.js
 *   - web/backend/middleware/auth.js
 *   - web/backend/config/cloudinary.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const uploadController = require("../controllers/uploadController");

// @route   POST /api/upload/single
// @desc    Upload single file (image/video)
// @access  Private
router.post(
  "/single",
  authenticate,
  uploadController.uploadSingle,
  uploadController.uploadFile
);

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private
router.post(
  "/multiple",
  authenticate,
  uploadController.uploadMultiple,
  uploadController.uploadFiles
);

// @route   POST /api/upload/avatar
// @desc    Upload avatar
// @access  Private
router.post(
  "/avatar",
  authenticate,
  uploadController.uploadSingle,
  uploadController.uploadAvatar
);

// @route   DELETE /api/upload
// @desc    Xóa file từ Cloudinary
// @access  Private
router.delete("/", authenticate, uploadController.deleteFile);

module.exports = router;
