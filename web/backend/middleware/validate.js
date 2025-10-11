/**
 * FILE: web/backend/middleware/validate.js
 * MỤC ĐÍCH: Middleware validation cho request data
 * LIÊN QUAN:
 *   - web/backend/routes/*.js
 *   - express-validator package
 * CHỨC NĂNG:
 *   - Validate input data (body, params, query)
 *   - Sanitize data
 *   - Return validation errors
 */

const { validationResult, body, param, query } = require("express-validator");

// Middleware: Check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// Validation rules

// User validation
const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscore"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  validate,
];

const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  validate,
];

// Post validation
const validateCreatePost = [
  body("title")
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Title must be between 10 and 300 characters"),

  body("content")
    .trim()
    .isLength({ min: 20, max: 50000 })
    .withMessage("Content must be between 20 and 50000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  validate,
];

const validateUpdatePost = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage("Title must be between 10 and 300 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 20, max: 50000 })
    .withMessage("Content must be between 20 and 50000 characters"),

  body("category").optional().isMongoId().withMessage("Invalid category ID"),

  validate,
];

// Comment validation
const validateCreateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Comment must be between 1 and 10000 characters"),

  body("postId")
    .notEmpty()
    .withMessage("Post ID is required")
    .isMongoId()
    .withMessage("Invalid post ID"),

  body("parentCommentId")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent comment ID"),

  validate,
];

// Category validation
const validateCreateCategory = [
  body("name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Category name must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("parentCategory")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent category ID"),

  validate,
];

// Report validation
const validateCreateReport = [
  body("targetType")
    .isIn(["Post", "Comment", "User"])
    .withMessage("Invalid target type"),

  body("targetId")
    .notEmpty()
    .withMessage("Target ID is required")
    .isMongoId()
    .withMessage("Invalid target ID"),

  body("reason")
    .isIn([
      "spam",
      "harassment",
      "hate_speech",
      "violence",
      "sexual_content",
      "misinformation",
      "copyright",
      "personal_information",
      "self_harm",
      "other",
    ])
    .withMessage("Invalid report reason"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  validate,
];

// ID validation
const validateMongoId = (paramName = "id") => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),

  validate,
];

// Pagination validation
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  validate,
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateCreatePost,
  validateUpdatePost,
  validateCreateComment,
  validateCreateCategory,
  validateCreateReport,
  validateMongoId,
  validatePagination,
};
