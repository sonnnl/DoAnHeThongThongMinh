/**
 * FILE: web/backend/config/cloudinary.js
 * MỤC ĐÍCH: Cấu hình Cloudinary để upload ảnh/video
 * LIÊN QUAN:
 *   - web/backend/middleware/upload.js
 *   - web/backend/controllers/uploadController.js
 *   - .env
 * CHỨC NĂNG:
 *   - Upload ảnh đại diện user
 *   - Upload ảnh/video trong posts (max 25MB)
 *   - Upload ảnh trong comments
 *   - Tối ưu ảnh, tạo thumbnails
 */

const cloudinary = require("cloudinary").v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper functions
const uploadImage = async (file, folder = "forum") => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: "image",
      transformation: [
        { width: 1920, height: 1080, crop: "limit" }, // Max resolution
        { quality: "auto" }, // Auto quality
        { fetch_format: "auto" }, // Auto format (WebP nếu browser support)
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      size: result.bytes,
      format: result.format,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const uploadVideo = async (file, folder = "forum/videos") => {
  try {
    // Giới hạn 25MB
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes

    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: "video",
      eager: [
        {
          width: 1280,
          height: 720,
          crop: "limit",
          quality: "auto",
          format: "mp4",
        },
      ],
      eager_async: true,
    });

    if (result.bytes > maxSize) {
      // Xóa video vừa upload nếu quá lớn
      await cloudinary.uploader.destroy(result.public_id, {
        resource_type: "video",
      });
      throw new Error("Video size exceeds 25MB limit");
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,
      size: result.bytes,
      format: result.format,
      thumbnailUrl:
        result.eager && result.eager[0]
          ? result.eager[0].secure_url
          : result.secure_url,
    };
  } catch (error) {
    throw new Error(`Cloudinary video upload failed: ${error.message}`);
  }
};

const uploadAvatar = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: "forum/avatars",
      resource_type: "image",
      transformation: [
        { width: 500, height: 500, crop: "fill", gravity: "face" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
};

const deleteFile = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadAvatar,
  deleteFile,
};
