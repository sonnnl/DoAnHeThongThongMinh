/**
 * FILE: web/backend/server.js
 * MỤC ĐÍCH: Entry point của backend application
 * LIÊN QUAN:
 *   - web/backend/config/database.js
 *   - web/backend/routes/*.js
 *   - web/backend/middleware/*.js
 * CHỨC NĂNG:
 *   - Khởi tạo Express app
 *   - Kết nối database
 *   - Setup middleware
 *   - Mount routes
 *   - Error handling
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/database");

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/votes", require("./routes/voteRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server with Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

// Create HTTP server and bind express app
const server = http.createServer(app);

// Init Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Attach io to app for controllers to use
app.set("io", io);

// Socket.IO events
io.on("connection", (socket) => {
  // Join personal room by userId (if provided)
  socket.on("auth:identify", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  // Join a conversation room
  socket.on("conversation:join", (conversationId) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  // Leave a conversation room
  socket.on("conversation:leave", (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(
    `🚀 Server + Socket.IO running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;
