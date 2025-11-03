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
    const { targetType, targetId, reason, description } = req.body;

    // Validate contentType
    if (!["Post", "Comment", "User"].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: "contentType phải là Post, Comment hoặc User",
      });
    }

    // Kiểm tra content tồn tại
    let content;
    let reportedUser;

    if (targetType === "Post") {
      content = await Post.findById(targetId);
      if (!content || content.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài viết",
        });
      }
      reportedUser = content.author;
    } else if (targetType === "Comment") {
      content = await Comment.findById(targetId);
      if (!content || content.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy comment",
        });
      }
      reportedUser = content.author;
    } else {
      // Report User
      content = await User.findById(targetId);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy user",
        });
      }
      reportedUser = targetId;
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
      targetType,
      targetId,
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
      targetType,
      targetId,
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
      contentType, // backward compat from frontend params
      targetType,  // preferred
      reason,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (status) {
      query.status = status;
    }

    // Support both targetType and legacy contentType
    const typeFilter = targetType || contentType;
    if (typeFilter) {
      query.targetType = typeFilter;
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
    if (report.targetType === "Post") {
      const post = await Post.findById(report.targetId)
        .populate("author", "username avatar")
        .lean();
      report.contentData = post;
    } else if (report.targetType === "Comment") {
      const comment = await Comment.findById(report.targetId)
        .populate("author", "username avatar")
        .populate("post", "title slug")
        .lean();
      report.contentData = comment;
    } else {
      const user = await User.findById(report.targetId)
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
    const { action, reviewNote, moderationAction } = req.body;

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

    // Nếu accept, cho phép chọn hành động moderation nâng cao
    if (action === "accept") {
      // Nếu có moderationAction cụ thể (phù hợp enum ở Report.action) thì dùng flow mới
      if (moderationAction) {
        await report.accept(req.user.id, moderationAction, reviewNote || "");
      } else {
        // Flow cũ: đánh dấu accepted + xóa nội dung tối thiểu
        report.status = "accepted";
        report.reviewedBy = req.user.id;
        report.reviewedAt = Date.now();
        report.reviewNote = reviewNote || "";
        await report.save();

        // Tối thiểu gỡ nội dung vi phạm
        if (report.targetType === "Post") {
          await Post.findByIdAndUpdate(report.targetId, { isDeleted: true });
        } else if (report.targetType === "Comment") {
          await Comment.findByIdAndUpdate(report.targetId, {
            isDeleted: true,
            content: "[Comment đã bị xóa do vi phạm quy định]",
          });
        }

        const reportedUser = await User.findById(report.reportedUser);
        reportedUser.handleAcceptedReport();
        await reportedUser.save();
      }
    } else {
      // reject
      await report.reject(req.user.id, reviewNote || "");
    }

    res.status(200).json({
      success: true,
      message: `Report đã được ${action === "accept" ? "chấp nhận" : "từ chối"}`,
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
    const { days = 30 } = req.query;
    const sinceDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const pending = await Report.countDocuments({ status: "pending" });
    const accepted = await Report.countDocuments({ status: "accepted" });
    const rejected = await Report.countDocuments({ status: "rejected" });

    // Top reported users
    const topReportedUsers = await Report.aggregate([
      { $match: { status: "accepted", reviewedAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: "$reportedUser",
          count: { $sum: 1 },
          lastAcceptedAt: { $max: "$reviewedAt" },
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
      lastAcceptedAt: item.lastAcceptedAt,
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
