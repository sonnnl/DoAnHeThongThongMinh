/**
 * FILE: web/backend/routes/uploadRoutes.js
 * MỤC ĐÍCH: Routes cho file uploads
 * LIÊN QUAN:
 *   - web/backend/controllers/uploadController.js
 *   - web/backend/config/cloudinary.js
 *   - web/backend/middleware/upload.js
 */

const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");

// @route   POST /api/upload/image
// @desc    Upload image
// @access  Private
router.post("/image", authenticate, (req, res) => {
  res.json({ message: "Upload image - TODO" });
});

// @route   POST /api/upload/video
// @desc    Upload video (max 25MB)
// @access  Private
router.post("/video", authenticate, (req, res) => {
  res.json({ message: "Upload video - TODO" });
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete uploaded file
// @access  Private
router.delete("/:publicId", authenticate, (req, res) => {
  res.json({ message: "Delete file - TODO" });
});

module.exports = router;
