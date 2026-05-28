module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/__dbtests__/**/*.test.js"],
  // DB integration tests: chạy MongoDB thật (mongodb-memory-server),
  // tuyệt đối không dùng bộ mocks ở tests/setup.js
  clearMocks: true,
  testTimeout: 30000,
  forceExit: true,
  maxWorkers: 1,
};

