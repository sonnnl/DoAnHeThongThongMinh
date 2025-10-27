/**
 * FILE: web/backend/controllers/reportController.js
 * MỤC ĐÍCH: Xử lý report vi phạm
 * LIÊN QUAN:
 *   - web/backend/models/Report.js
 *   - web/backend/models/Post.js
 *   - web/backend/models/Comment.js
 *   - web/backend/models/User.js
 *   - web/backend/routes/reportRoutes.js
 * CHỨC NĂNG:
 *   - Tạo report
 *   - Xử lý report (Admin/Moderator)
 *   - Lấy danh sách reports
 */

const Report = require("../models/Report");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");

// @desc    Tạo report mới
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res, next) => {
  try {
    const { contentType, contentId, reason, description } = req.body;

    // Validate contentType
    if (!["Post", "Comment", "User"].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: "contentType phải là Post, Comment hoặc User",
      });
    }

    // Kiểm tra content tồn tại
    let content;
    let reportedUser;

    if (contentType === "Post") {
      content = await Post.findById(contentId);
      if (!content || content.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài viết",
        });
      }
      reportedUser = content.author;
    } else if (contentType === "Comment") {
      content = await Comment.findById(contentId);
      if (!content || content.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy comment",
        });
      }
      reportedUser = content.author;
    } else {
      // Report User
      content = await User.findById(contentId);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy user",
        });
      }
      reportedUser = contentId;
    }

    // Không thể report chính mình
    if (reportedUser.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Không thể report chính mình",
      });
    }

    // Kiểm tra đã report chưa
    const existingReport = await Report.findOne({
      reporter: req.user.id,
      contentType,
      contentId,
      status: "pending",
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã report nội dung này rồi",
      });
    }

    // Tạo report
    const report = await Report.create({
      reporter: req.user.id,
      reportedUser,
      contentType,
      contentId,
      reason,
      description,
    });

    // Update reported user stats
    await User.findByIdAndUpdate(reportedUser, {
      $inc: { "stats.reportsReceived": 1 },
    });

    await report.populate("reporter", "username avatar");

    res.status(201).json({
      success: true,
      message:
        "Report đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách reports (Admin/Moderator)
// @route   GET /api/reports
// @access  Private (Admin/Moderator)
exports.getReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "pending",
      contentType,
      reason,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (status) {
      query.status = status;
    }

    if (contentType) {
      query.contentType = contentType;
    }

    if (reason) {
      query.reason = reason;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("reporter", "username avatar badge")
      .populate("reportedUser", "username avatar badge")
      .populate("reviewedBy", "username")
      .lean();

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết report
// @route   GET /api/reports/:reportId
// @access  Private (Admin/Moderator)
exports.getReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate("reporter", "username avatar badge stats")
      .populate("reportedUser", "username avatar badge stats")
      .populate("reviewedBy", "username avatar")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy report",
      });
    }

    // Lấy content data
    if (report.contentType === "Post") {
      const post = await Post.findById(report.contentId)
        .populate("author", "username avatar")
        .lean();
      report.contentData = post;
    } else if (report.contentType === "Comment") {
      const comment = await Comment.findById(report.contentId)
        .populate("author", "username avatar")
        .populate("post", "title slug")
        .lean();
      report.contentData = comment;
    } else {
      const user = await User.findById(report.contentId)
        .select("-password -resetPasswordToken")
        .lean();
      report.contentData = user;
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xử lý report (accept/reject)
// @route   PUT /api/reports/:reportId
// @access  Private (Admin/Moderator)
exports.reviewReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { action, reviewNote } = req.body;

    // Validate action
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action phải là accept hoặc reject",
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy report",
      });
    }

    if (report.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Report này đã được xử lý rồi",
      });
    }

    // Update report
    report.status = action === "accept" ? "accepted" : "rejected";
    report.reviewedBy = req.user.id;
    report.reviewedAt = Date.now();
    report.reviewNote = reviewNote || "";

    await report.save();

    // Nếu accept report
    if (action === "accept") {
      const reportedUser = await User.findById(report.reportedUser);

      // Xử lý content
      if (report.contentType === "Post") {
        await Post.findByIdAndUpdate(report.contentId, { isDeleted: true });
      } else if (report.contentType === "Comment") {
        await Comment.findByIdAndUpdate(report.contentId, {
          isDeleted: true,
          content: "[Comment đã bị xóa do vi phạm quy định]",
        });
      }

      // Xử lý user bị report
      reportedUser.handleAcceptedReport();
      await reportedUser.save();

      // TODO: Gửi notification cho user bị report
    }

    // TODO: Gửi notification cho reporter

    res.status(200).json({
      success: true,
      message: `Report đã được ${
        action === "accept" ? "chấp nhận" : "từ chối"
      }`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy reports của user (user xem reports mà mình đã gửi)
// @route   GET /api/reports/my-reports
// @access  Private
exports.getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find({ reporter: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("reportedUser", "username avatar")
      .lean();

    const total = await Report.countDocuments({ reporter: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thống kê reports
// @route   GET /api/reports/stats
// @access  Private (Admin/Moderator)
exports.getReportStats = async (req, res, next) => {
  try {
    const pending = await Report.countDocuments({ status: "pending" });
    const accepted = await Report.countDocuments({ status: "accepted" });
    const rejected = await Report.countDocuments({ status: "rejected" });

    // Top reported users
    const topReportedUsers = await Report.aggregate([
      { $match: { status: "accepted" } },
      {
        $group: {
          _id: "$reportedUser",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Populate user info
    const userIds = topReportedUsers.map((u) => u._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("username avatar badge stats")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const topReported = topReportedUsers.map((item) => ({
      user: userMap[item._id.toString()],
      reportsCount: item.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        pending,
        accepted,
        rejected,
        total: pending + accepted + rejected,
        topReportedUsers: topReported,
      },
    });
  } catch (error) {
    next(error);
  }
};
