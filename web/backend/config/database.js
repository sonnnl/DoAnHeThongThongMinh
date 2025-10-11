/**
 * FILE: web/backend/config/database.js
 * MỤC ĐÍCH: Cấu hình kết nối MongoDB
 * LIÊN QUAN:
 *   - web/backend/server.js
 *   - .env
 * CHỨC NĂNG:
 *   - Kết nối đến MongoDB Atlas hoặc local MongoDB
 *   - Error handling và retry logic
 *   - Connection pooling
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 5,

      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,

      // Auto index
      autoIndex: process.env.NODE_ENV === "development",

      // Other options
      family: 4, // Use IPv4
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
