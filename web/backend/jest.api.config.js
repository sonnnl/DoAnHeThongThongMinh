/**
 * FILE: jest.api.config.js
 * MỤC ĐÍCH: Jest config riêng cho API integration tests (supertest + MongoMemoryServer)
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/__tests__/**/*.test.js"],
  clearMocks: true,
  testTimeout: 30000,
  forceExit: true,
  maxWorkers: 1,          // Chạy tuần tự để tránh conflict DB connections
  verbose: true,
};
