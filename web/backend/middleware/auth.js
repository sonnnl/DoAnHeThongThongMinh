/**
 * FILE: web/backend/middleware/auth.js
 * MỤC ĐÍCH: Middleware xác thực và phân quyền
 * LIÊN QUAN:
 *   - web/backend/models/User.js
 *   - web/backend/routes/*.js
 *   - web/backend/config/jwt.js
 * CHỨC NĂNG:
 *   - Verify JWT token
 *   - Check user roles (user, moderator, admin)
 *   - Check user restrictions (banned, can comment, can post)
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware: Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user từ database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    // Kiểm tra có bị ban không
    if (
      user.restrictions.bannedUntil &&
      user.restrictions.bannedUntil > Date.now()
    ) {
      return res.status(403).json({
        success: false,
        message: `You are banned until ${user.restrictions.bannedUntil.toLocaleString(
          "vi-VN"
        )}`,
        reason: user.restrictions.banReason,
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Middleware: Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
  next();
};

// Middleware: Check if user is moderator or admin
const isModerator = (req, res, next) => {
  if (!["moderator", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Moderator or Admin only.",
    });
  }
  next();
};

// Middleware: Check if user can post
const canPost = (req, res, next) => {
  const checkResult = req.user.canCreatePost();

  if (!checkResult.allowed) {
    return res.status(403).json({
      success: false,
      message: checkResult.reason,
    });
  }

  next();
};

// Middleware: Check if user can comment
const canComment = (req, res, next) => {
  const checkResult = req.user.canCreateComment();

  if (!checkResult.allowed) {
    return res.status(403).json({
      success: false,
      message: checkResult.reason,
    });
  }

  next();
};

// Middleware: Optional authentication (không bắt buộc login)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Token không hợp lệ nhưng vẫn cho phép tiếp tục (optional auth)
    next();
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isModerator,
  canPost,
  canComment,
  optionalAuth,
};
