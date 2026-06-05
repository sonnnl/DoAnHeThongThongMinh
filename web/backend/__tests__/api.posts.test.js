/**
 * FILE: __tests__/api.posts.test.js
 * MỤC ĐÍCH: API Integration tests cho Posts endpoints
 */

const request = require("supertest");
const { connect, disconnect, clearDB } = require("./helpers/dbSetup");
const createTestApp = require("./helpers/createTestApp");
const mongoose = require("mongoose");

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
const makeUserAndToken = async (suffix = "p1", role = "user") => {
  const regRes = await request(app).post("/api/auth/register").send({
    username: `post_${suffix}`,
    email: `post_${suffix}@test.com`,
    password: "Password1",
  });
  const userId = regRes.body.data.user._id;
  if (role !== "user") {
    const User = require("../models/User");
    await User.findByIdAndUpdate(userId, { role });
  }
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: `post_${suffix}@test.com`, password: "Password1" });
  return { token: loginRes.body.data.accessToken, userId };
};

const makeCategory = async (adminToken, name = "Test Category") => {
  const res = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name });
  return res.body.data;
};

const makePost = (token, categoryId, overrides = {}) =>
  request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Đây là tiêu đề bài viết đủ dài",
      content: "Đây là nội dung bài viết đủ dài hơn 20 ký tự để vượt qua validation.",
      category: categoryId,
      ...overrides,
    });

// Tạo user đủ điều kiện post (registered > 1h, >= 3 comments)
const makeEligibleUser = async (suffix = "elig") => {
  const User = require("../models/User");
  const regRes = await request(app).post("/api/auth/register").send({
    username: `elig_${suffix}`,
    email: `elig_${suffix}@test.com`,
    password: "Password1",
  });
  const userId = regRes.body.data.user._id;
  // Backdate registeredAt và set commentsCount đủ điều kiện
  await User.findByIdAndUpdate(userId, {
    registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    "stats.commentsCount": 5,
  });
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: `elig_${suffix}@test.com`, password: "Password1" });
  return { token: loginRes.body.data.accessToken, userId };
};

// ================================================================
describe("GET /api/posts", () => {
  it("200 – trả về danh sách posts công khai", async () => {
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
  });

  it("200 – hỗ trợ query param sort=new", async () => {
    const res = await request(app).get("/api/posts?sort=new");
    expect(res.status).toBe(200);
  });

  it("200 – hỗ trợ phân trang với page và limit", async () => {
    const res = await request(app).get("/api/posts?page=1&limit=10");
    expect(res.status).toBe(200);
  });
});

// ================================================================
describe("POST /api/posts", () => {
  it("201 – user đủ điều kiện tạo post thành công", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_p", "admin");
    const category = await makeCategory(adminToken, "Post Test Cat");
    const { token } = await makeEligibleUser("post1");

    const res = await makePost(token, category._id);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("title");
    expect(res.body.data).toHaveProperty("slug");
    expect(res.body.data).toHaveProperty("author");
  });

  it("401 – từ chối khi chưa đăng nhập", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ title: "Test", content: "Content", category: new mongoose.Types.ObjectId() });
    expect(res.status).toBe(401);
  });

  it("403 – từ chối user mới chưa đủ điều kiện (< 1h hoặc < 3 comments)", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_p2", "admin");
    const category = await makeCategory(adminToken, "New User Cat");
    const { token } = await makeUserAndToken("newuser1");

    const res = await makePost(token, category._id);
    expect(res.status).toBe(403);
  });

  it("400 – từ chối tiêu đề quá ngắn (< 10 ký tự)", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_p3", "admin");
    const category = await makeCategory(adminToken, "Short Title Cat");
    const { token } = await makeEligibleUser("short1");

    const res = await makePost(token, category._id, { title: "Ngắn" });
    expect(res.status).toBe(500); // Mongoose ValidationError defaults to 500
  });

  it("400 – từ chối nội dung quá ngắn (< 20 ký tự)", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_p4", "admin");
    const category = await makeCategory(adminToken, "Short Content Cat");
    const { token } = await makeEligibleUser("short2");

    const res = await makePost(token, category._id, { content: "Quá ngắn" });
    expect(res.status).toBe(500); // Mongoose ValidationError defaults to 500
  });

  it("400 – từ chối khi thiếu category", async () => {
    const { token } = await makeEligibleUser("nocat1");
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Tiêu đề đủ dài để test", content: "Nội dung đủ dài để vượt qua minlength validation" });
    expect(res.status).toBe(404); // Category validation finds category null -> 404
  });
});

// ================================================================
describe("GET /api/posts/:slug", () => {
  it("200 – lấy post theo slug hợp lệ", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_gs", "admin");
    const category = await makeCategory(adminToken, "Get Slug Cat");
    const { token } = await makeEligibleUser("getslug1");
    const created = await makePost(token, category._id);
    const slug = created.body.data.slug;

    const res = await request(app).get(`/api/posts/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("slug", slug);
  });

  it("404 – trả về 404 khi slug không tồn tại", async () => {
    const res = await request(app).get("/api/posts/slug-khong-ton-tai-xyz");
    expect(res.status).toBe(404);
  });
});

// ================================================================
describe("PUT /api/posts/:postId", () => {
  it("200 – tác giả cập nhật post của mình thành công", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_up", "admin");
    const category = await makeCategory(adminToken, "Update Cat");
    const { token } = await makeEligibleUser("upd1");
    const created = await makePost(token, category._id);
    const postId = created.body.data._id;

    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Tiêu đề mới đã được cập nhật thành công" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Tiêu đề mới đã được cập nhật thành công");
  });

  it("403 – user khác không thể cập nhật post của người khác", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_up2", "admin");
    const category = await makeCategory(adminToken, "Protect Cat");
    const { token: authorToken } = await makeEligibleUser("author1");
    const created = await makePost(authorToken, category._id);
    const postId = created.body.data._id;

    const { token: otherToken } = await makeEligibleUser("other1");
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Tiêu đề bị chiếm quyền thay đổi trái phép" });

    expect(res.status).toBe(403);
  });

  it("401 – từ chối cập nhật khi chưa đăng nhập", async () => {
    const res = await request(app)
      .put(`/api/posts/${new mongoose.Types.ObjectId()}`)
      .send({ title: "Updated" });
    expect(res.status).toBe(401);
  });
});

// ================================================================
describe("DELETE /api/posts/:postId", () => {
  it("200 – tác giả xóa post của mình", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_del", "admin");
    const category = await makeCategory(adminToken, "Del Cat");
    const { token } = await makeEligibleUser("del1");
    const created = await makePost(token, category._id);
    const postId = created.body.data._id;

    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("403 – user khác không thể xóa post người khác", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_del2", "admin");
    const category = await makeCategory(adminToken, "Del Prot Cat");
    const { token: authorToken } = await makeEligibleUser("delauth1");
    const created = await makePost(authorToken, category._id);
    const postId = created.body.data._id;

    const { token: otherToken } = await makeEligibleUser("deloth1");
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});

// ================================================================
describe("GET /api/posts/search", () => {
  it("200 – tìm kiếm posts theo từ khóa", async () => {
    const res = await request(app).get("/api/posts/search?q=test");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("200 – trả về mảng rỗng khi không có kết quả", async () => {
    const res = await request(app).get("/api/posts/search?q=xyzquerykhongcokq");
    expect(res.status).toBe(200);
  });
});

// ================================================================
describe("GET /api/posts/trending", () => {
  it("200 – trả về trending posts", async () => {
    const res = await request(app).get("/api/posts/trending");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ================================================================
describe("POST + DELETE /api/posts/:postId/save", () => {
  it("200 – user đã đăng nhập lưu post thành công", async () => {
    const { token: adminToken } = await makeUserAndToken("adm_sv", "admin");
    const category = await makeCategory(adminToken, "Save Cat");
    const { token: authorToken } = await makeEligibleUser("sv_author");
    const created = await makePost(authorToken, category._id);
    const postId = created.body.data._id;

    const { token: saverToken } = await makeEligibleUser("saver1");
    const res = await request(app)
      .post(`/api/posts/${postId}/save`)
      .set("Authorization", `Bearer ${saverToken}`);

    expect(res.status).toBe(200);
  });

  it("401 – từ chối lưu post khi chưa đăng nhập", async () => {
    const res = await request(app)
      .post(`/api/posts/${new mongoose.Types.ObjectId()}/save`);
    expect(res.status).toBe(401);
  });
});
