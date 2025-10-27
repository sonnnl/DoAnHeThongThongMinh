/**
 * FILE: web/backend/controllers/authController.js
 * MỤC ĐÍCH: Xử lý authentication (đăng ký, đăng nhập, OAuth)
 * LIÊN QUAN:
 *   - web/backend/models/User.js
 *   - web/backend/routes/authRoutes.js
 *   - web/backend/middleware/auth.js
 * CHỨC NĂNG:
 *   - Đăng ký tài khoản mới
 *   - Đăng nhập (email/password)
 *   - Đăng nhập Google OAuth
 *   - Refresh token
 *   - Forgot/Reset password
 *   - Verify email
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Generate JWT Token
const generateToken = (userId, type = "access") => {
  const secret =
    type === "access" ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
  const expiresIn = type === "access" ? "7d" : "30d";

  return jwt.sign({ userId, type }, secret, { expiresIn });
};

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: "Username đã được sử dụng",
        });
      }
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password,
      registeredAt: new Date(),
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    await user.save();

    // TODO: Gửi email verification (implement sau)
    // await sendVerificationEmail(user.email, verificationToken);

    // Fetch lại user để có đầy đủ data
    const fullUser = await User.findById(user._id)
      .select("-password -resetPasswordToken -verificationToken -blockedUsers")
      .lean();

    // Generate tokens
    const accessToken = generateToken(user._id, "access");
    const refreshToken = generateToken(user._id, "refresh");

    // Response
    res.status(201).json({
      success: true,
      message:
        "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
      data: {
        user: fullUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    // Kiểm tra có bị ban không
    if (
      user.restrictions.bannedUntil &&
      user.restrictions.bannedUntil > Date.now()
    ) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản bị cấm đến ${user.restrictions.bannedUntil.toLocaleString(
          "vi-VN"
        )}. Lý do: ${user.restrictions.banReason}`,
      });
    }

    // Update last login
    user.lastLoginAt = Date.now();
    user.lastActivityAt = Date.now();
    await user.save();

    // Fetch lại user để có đầy đủ data mới nhất
    const fullUser = await User.findById(user._id)
      .select("-password -resetPasswordToken -verificationToken -blockedUsers")
      .lean();

    // Generate tokens
    const accessToken = generateToken(user._id, "access");
    const refreshToken = generateToken(user._id, "refresh");

    // Response
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: fullUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -verificationToken -resetPasswordToken")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token không được cung cấp",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(decoded.userId, "access");
    const newRefreshToken = generateToken(decoded.userId, "refresh");

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user
    const user = await User.findOne({ verificationToken: hashedToken });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Update user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email đã được xác thực thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user với email này",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // TODO: Send email with reset token
    // await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: "Email reset password đã được gửi",
      // Dev only - remove in production
      ...(process.env.NODE_ENV === "development" && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth Login/Register
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    // Tìm hoặc tạo user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Tạo username từ email
      let username = email.split("@")[0];

      // Kiểm tra username đã tồn tại chưa
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `${username}_${Date.now()}`;
      }

      user = await User.create({
        googleId,
        email,
        username,
        avatar,
        isVerified: true, // Google account đã verify email
      });
    } else {
      // Update google ID nếu user đã tồn tại nhưng chưa có googleId
      if (!user.googleId) {
        user.googleId = googleId;
      }

      user.lastLoginAt = Date.now();
      user.lastActivityAt = Date.now();
      await user.save();
    }

    // Fetch lại user để có đầy đủ data mới nhất
    const fullUser = await User.findById(user._id)
      .select("-password -resetPasswordToken -verificationToken -blockedUsers")
      .lean();

    // Generate tokens
    const accessToken = generateToken(user._id, "access");
    const refreshToken = generateToken(user._id, "refresh");

    res.status(200).json({
      success: true,
      message: "Đăng nhập Google thành công",
      data: {
        user: fullUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (client-side sẽ xóa token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Trong trường hợp này, logout chủ yếu xử lý ở client
    // Server có thể log hoặc thực hiện các tác vụ cleanup nếu cần

    res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    next(error);
  }
};
