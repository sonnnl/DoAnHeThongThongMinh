/**
 * FILE: __tests__/api.categories.test.js
 * MỤC ĐÍCH: API Integration tests cho Categories endpoints
 */

const request = require("supertest");
const { connect, disconnect, clearDB } = require("./helpers/dbSetup");
const createTestApp = require("./helpers/createTestApp");

process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret";
process.env.NODE_ENV = "test";

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
// Helpers
const makeUser = async (role = "user", suffix = "u1") => {
  const res = await request(app).post("/api/auth/register").send({
    username: `cat_${suffix}`,
    email: `cat_${suffix}@test.com`,
    password: "Password1",
  });
  if (role !== "user") {
    const User = require("../models/User");
    await User.findByIdAndUpdate(res.body.data.user._id, { role });
  }
  // Re-login to get fresh token with correct role (role is checked from DB)
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: `cat_${suffix}@test.com`, password: "Password1" });
  return {
    token: loginRes.body.data?.accessToken || res.body.data.accessToken,
    userId: res.body.data.user._id,
  };
};

const makeAdminToken = async () => {
  const { token, userId } = await makeUser("admin", "admin");
  return token;
};

const createCategory = (token, name = "Tech Forum") =>
  request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, description: "Chuyên mục công nghệ" });

// ================================================================
describe("GET /api/categories", () => {
  it("200 – trả về danh sách categories (public)", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("200 – không cần token để lấy danh sách", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
  });
});

// ================================================================
describe("POST /api/categories", () => {
  it("201 – admin tạo category thành công", async () => {
    const adminToken = await makeAdminToken();
    const res = await createCategory(adminToken, "Lập Trình Web");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("name", "Lập Trình Web");
    expect(res.body.data).toHaveProperty("slug");
  });

  it("401 – từ chối tạo category khi chưa đăng nhập", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "Hacking" });
    expect(res.status).toBe(401);
  });

  it("403 – từ chối user thường tạo category", async () => {
    const { token } = await makeUser("user", "reg1");
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My Category" });
    expect(res.status).toBe(403);
  });
});

// ================================================================
describe("GET /api/categories/:slug", () => {
  it("200 – lấy category theo slug hợp lệ", async () => {
    const adminToken = await makeAdminToken();
    const created = await createCategory(adminToken, "Khoa Học Máy Tính");
    const slug = created.body.data.slug;

    const res = await request(app).get(`/api/categories/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("slug", slug);
  });

  it("404 – trả về 404 khi slug không tồn tại", async () => {
    const res = await request(app).get("/api/categories/slug-khong-ton-tai");
    expect(res.status).toBe(404);
  });
});

// ================================================================
describe("PUT /api/categories/:categoryId", () => {
  it("200 – admin cập nhật category thành công", async () => {
    const adminToken = await makeAdminToken();
    const created = await createCategory(adminToken, "Old Name");
    const catId = created.body.data._id;

    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New Name", description: "Mô tả mới" });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("New Name");
  });

  it("403 – user thường không được cập nhật category", async () => {
    const adminToken = await makeAdminToken();
    const created = await createCategory(adminToken, "Protected Cat");
    const catId = created.body.data._id;

    const { token: userToken } = await makeUser("user", "reg2");
    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Hacked" });

    expect(res.status).toBe(403);
  });
});

// ================================================================
describe("DELETE /api/categories/:categoryId", () => {
  it("200 – admin xóa category thành công", async () => {
    const adminToken = await makeAdminToken();
    const created = await createCategory(adminToken, "To Be Deleted");
    const catId = created.body.data._id;

    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("403 – moderator không được xóa category", async () => {
    const adminToken = await makeAdminToken();
    const created = await createCategory(adminToken, "Safe Cat");
    const catId = created.body.data._id;

    const { token: modToken } = await makeUser("moderator", "mod1");
    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set("Authorization", `Bearer ${modToken}`);

    expect(res.status).toBe(403);
  });
});

// ================================================================
describe("GET /api/categories/trending", () => {
  it("200 – trả về trending categories", async () => {
    const res = await request(app).get("/api/categories/trending");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
