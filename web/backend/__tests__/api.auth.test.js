/**
 * FILE: __tests__/api.auth.test.js
 * MỤC ĐÍCH: API Integration tests cho Authentication endpoints
 * Phạm vi: POST /register, POST /login, GET /me, POST /refresh, POST /logout,
 *           POST /forgot-password, POST /google
 */

const request = require("supertest");
const { connect, disconnect, clearDB } = require("./helpers/dbSetup");
const createTestApp = require("./helpers/createTestApp");

// Thiết lập JWT secrets cho test
process.env.JWT_SECRET = "test-jwt-secret-for-auth-tests";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-for-auth-tests";
process.env.NODE_ENV = "development";

let app;

beforeAll(async () => {
  await connect();
  app = createTestApp();
});

afterAll(async () => {
  await disconnect();
});

afterEach(async () => {
  await clearDB();
});

// ================================================================
// Helper: đăng ký và lấy token
const registerUser = async (overrides = {}) => {
  const userData = {
    username: "testuser",
    email: "test@example.com",
    password: "Password1",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(userData);
  return res;
};

const loginUser = async (email = "test@example.com", password = "Password1") => {
  return request(app).post("/api/auth/login").send({ email, password });
};

// ================================================================
describe("POST /api/auth/register", () => {
  it("201 – đăng ký thành công với dữ liệu hợp lệ", async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
    expect(res.body.data.user).toHaveProperty("username", "testuser");
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("400 – từ chối email không hợp lệ", async () => {
    const res = await registerUser({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("400 – từ chối password yếu (không đủ uppercase/số)", async () => {
    const res = await registerUser({ password: "weakpass" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("400 – từ chối username ngắn hơn 3 ký tự", async () => {
    const res = await registerUser({ username: "ab" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("400 – từ chối email đã được sử dụng", async () => {
    await registerUser();
    const res = await registerUser({ username: "anotheruser" }); // cùng email
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Email");
  });

  it("400 – từ chối username đã được sử dụng", async () => {
    await registerUser();
    const res = await registerUser({ email: "other@example.com" }); // cùng username
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Username");
  });
});

// ================================================================
describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await registerUser();
  });

  it("200 – đăng nhập thành công với credentials đúng", async () => {
    const res = await loginUser();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user).toHaveProperty("username", "testuser");
  });

  it("401 – từ chối email không tồn tại", async () => {
    const res = await loginUser("notfound@example.com");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("401 – từ chối password sai", async () => {
    const res = await loginUser("test@example.com", "WrongPassword1");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("400 – từ chối thiếu trường password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });
    expect(res.status).toBe(400);
  });

  it("400 – từ chối thiếu trường email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "Password1" });
    expect(res.status).toBe(400);
  });
});

// ================================================================
describe("GET /api/auth/me", () => {
  it("200 – trả về thông tin user hiện tại với token hợp lệ", async () => {
    await registerUser();
    const loginRes = await loginUser();
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("username", "testuser");
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("401 – từ chối khi không có token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("401 – từ chối token giả mạo", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer fake.jwt.token");
    expect(res.status).toBe(401);
  });

  it("401 – từ chối token sai định dạng Bearer", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "InvalidFormat token");
    expect(res.status).toBe(401);
  });
});

// ================================================================
describe("POST /api/auth/refresh", () => {
  it("200 – cấp accessToken và refreshToken mới từ refreshToken hợp lệ", async () => {
    await registerUser();
    const loginRes = await loginUser();
    const refreshToken = loginRes.body.data.refreshToken;

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
  });

  it("400 – từ chối khi không cung cấp refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("401 – từ chối refreshToken giả mạo", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "fake.refresh.token" });
    expect(res.status).toBe(401);
  });

  it("401 – từ chối accessToken dùng làm refreshToken", async () => {
    await registerUser();
    const loginRes = await loginUser();
    const accessToken = loginRes.body.data.accessToken; // Dùng sai loại token

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: accessToken });
    expect(res.status).toBe(401);
  });
});

// ================================================================
describe("POST /api/auth/logout", () => {
  it("200 – đăng xuất thành công khi đã xác thực", async () => {
    await registerUser();
    const loginRes = await loginUser();
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("401 – từ chối logout khi chưa đăng nhập", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });
});

// ================================================================
describe("POST /api/auth/forgot-password", () => {
  it("200 – gửi reset token khi email tồn tại", async () => {
    await registerUser();
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Dev mode trả về resetToken
    expect(res.body).toHaveProperty("resetToken");
  });

  it("404 – từ chối khi email không tồn tại", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(404);
  });
});

// ================================================================
describe("POST /api/auth/reset-password/:token", () => {
  it("200 – đặt lại mật khẩu thành công với token hợp lệ", async () => {
    await registerUser();
    const forgotRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    const resetToken = forgotRes.body.resetToken;

    const res = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({ password: "NewPassword2" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("400 – từ chối token không hợp lệ", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password/invalidtoken123")
      .send({ password: "NewPassword2" });

    expect(res.status).toBe(400);
  });
});

// ================================================================
describe("POST /api/auth/google", () => {
  it("200 – tạo user mới qua Google OAuth", async () => {
    const res = await request(app).post("/api/auth/google").send({
      googleId: "google-uid-12345",
      email: "googleuser@gmail.com",
      name: "Google User",
      avatar: "https://avatar.google.com/photo.jpg",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user).toHaveProperty("email", "googleuser@gmail.com");
    expect(res.body.data.user.isVerified).toBe(true);
  });

  it("200 – đăng nhập lại user Google đã tồn tại", async () => {
    // Lần 1: tạo mới
    await request(app).post("/api/auth/google").send({
      googleId: "google-uid-99999",
      email: "existing@gmail.com",
      name: "Existing User",
      avatar: null,
    });

    // Lần 2: đăng nhập lại
    const res = await request(app).post("/api/auth/google").send({
      googleId: "google-uid-99999",
      email: "existing@gmail.com",
      name: "Existing User",
      avatar: null,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
describe("GET /health", () => {
  it("200 – health check endpoint hoạt động", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Server is running");
  });
});

// ================================================================
describe("404 handler", () => {
  it("404 – route không tồn tại", async () => {
    const res = await request(app).get("/api/nonexistent-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
