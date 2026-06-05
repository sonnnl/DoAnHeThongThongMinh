/**
 * FILE: __tests__/helpers/createTestApp.js
 * MỤC ĐÍCH: Tạo Express app dùng riêng cho testing (không connect DB thật, không listen port)
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");

// Mock aiAnalysis middleware – skip AI call during tests
jest.mock("../../middleware/aiAnalysis", () => (req, _res, next) => {
  req.aiAnalysis = {
    isToxic: false,
    toxicScore: 0,
    toxicType: "clean",
    emotion: "neutral",
    emotionScore: 0,
    analyzedAt: null,
  };
  next();
});

function createTestApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: "*", credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(mongoSanitize());

  // Routes
  app.use("/api/auth", require("../../routes/authRoutes"));
  app.use("/api/users", require("../../routes/userRoutes"));
  app.use("/api/categories", require("../../routes/categoryRoutes"));
  app.use("/api/posts", require("../../routes/postRoutes"));
  app.use("/api/comments", require("../../routes/commentRoutes"));
  app.use("/api/votes", require("../../routes/voteRoutes"));

  // Health check
  app.get("/health", (_req, res) =>
    res.status(200).json({ success: true, message: "Server is running" })
  );

  // 404
  app.use((_req, res) =>
    res.status(404).json({ success: false, message: "Route not found" })
  );

  // Global error handler
  app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  });

  return app;
}

module.exports = createTestApp;
