/**
 * FILE: web/backend/routes/authRoutes.js
 * MỤC ĐÍCH: Routes cho authentication
 * LIÊN QUAN:
 *   - web/backend/controllers/authController.js
 *   - web/backend/middleware/auth.js
 *   - web/backend/middleware/validate.js
 */

const express = require("express");
const router = express.Router();

// Import controllers
const authController = require("../controllers/authController");

// Import middleware
const { validateRegister, validateLogin } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

// Routes

// @route   POST /api/auth/register
// @desc    Đăng ký user mới
// @access  Public
router.post("/register", validateRegister, authController.register);

// @route   POST /api/auth/login
// @desc    Đăng nhập
// @access  Public
router.post("/login", validateLogin, authController.login);

// @route   GET /api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get("/me", authenticate, authController.getMe);

// @route   POST /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.post("/google", authController.googleAuth);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post("/refresh", authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout
// @access  Private
router.post("/logout", authenticate, authController.logout);

// @route   GET /api/auth/verify/:token
// @desc    Verify email
// @access  Public
router.get("/verify/:token", authController.verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post("/forgot-password", authController.forgotPassword);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
