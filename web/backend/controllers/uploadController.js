/**
 * FILE: web/backend/controllers/uploadController.js
 * MỤC ĐÍCH: Xử lý upload files (ảnh, video) lên Cloudinary
 * LIÊN QUAN:
 *   - web/backend/config/cloudinary.js
 *   - web/backend/routes/uploadRoutes.js
 * CHỨC NĂNG:
 *   - Upload ảnh (avatar, post images, comment images)
 *   - Upload video (max 25MB)
 *   - Validate file type và size
 */

const { cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const path = require("path");

// Multer memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  // Allowed video types
  const videoTypes = /mp4|avi|mov|wmv|flv|webm/;

  const extname =
    imageTypes.test(path.extname(file.originalname).toLowerCase()) ||
    videoTypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype =
    imageTypes.test(file.mimetype) || videoTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Chỉ chấp nhận file ảnh (jpg, png, gif, webp) hoặc video (mp4, avi, mov, webm)"
      )
    );
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: fileFilter,
});

// Upload single file
exports.uploadSingle = upload.single("file");

// Upload multiple files
exports.uploadMultiple = upload.array("files", 10); // Max 10 files

// @desc    Upload single image/video
// @route   POST /api/upload/single
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn file để upload",
      });
    }

    const { folder = "general" } = req.body;

    // Upload to Cloudinary using buffer
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `forum/${folder}`,
            resource_type: "auto",
            transformation:
              folder === "avatars"
                ? [
                    { width: 400, height: 400, crop: "fill", gravity: "face" },
                    { quality: "auto" },
                  ]
                : [{ quality: "auto" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });
    };

    const result = await uploadToCloudinary();

    res.status(200).json({
      success: true,
      message: "Upload thành công",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        size: result.bytes,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    next(error);
  }
};

// @desc    Upload multiple images/videos
// @route   POST /api/upload/multiple
// @access  Private
exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn files để upload",
      });
    }

    const { folder = "general" } = req.body;

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `forum/${folder}`,
            resource_type: "auto",
            transformation: [{ quality: "auto" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              resourceType: result.resource_type,
              width: result.width,
              height: result.height,
              size: result.bytes,
            });
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: "Upload thành công",
      data: results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    next(error);
  }
};

// @desc    Xóa file từ Cloudinary
// @route   DELETE /api/upload
// @access  Private
exports.deleteFile = async (req, res, next) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp publicId",
      });
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    res.status(200).json({
      success: true,
      message: "Xóa file thành công",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh avatar",
      });
    }

    // Upload to Cloudinary
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "forum/avatars",
            resource_type: "image",
            transformation: [
              { width: 400, height: 400, crop: "fill", gravity: "face" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });
    };

    const result = await uploadToCloudinary();

    // Update user avatar
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user.id, { avatar: result.secure_url });

    res.status(200).json({
      success: true,
      message: "Upload avatar thành công",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    next(error);
  }
};
