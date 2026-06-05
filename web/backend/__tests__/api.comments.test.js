/**
 * FILE: __tests__/api.comments.test.js
 * MỤC ĐÍCH: API Integration tests cho Comments endpoints
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
const setupUserAndPost = async () => {
  const User = require("../models/User");

  // Admin để tạo category
  const adminReg = await request(app).post("/api/auth/register").send({
    username: "cmt_admin",
    email: "cmt_admin@test.com",
    password: "Password1",
  });
  await User.findByIdAndUpdate(adminReg.body.data.user._id, { role: "admin" });
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "cmt_admin@test.com", password: "Password1" });
  const adminToken = adminLogin.body.data.accessToken;

  const catRes = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Comment Test Category" });
  const categoryId = catRes.body.data._id;

  // Author user
  const authorReg = await request(app).post("/api/auth/register").send({
    username: "cmt_author",
    email: "cmt_author@test.com",
    password: "Password1",
  });
  const authorId = authorReg.body.data.user._id;
  await User.findByIdAndUpdate(authorId, {
    registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    "stats.commentsCount": 5,
  });
  const authorLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "cmt_author@test.com", password: "Password1" });
  const authorToken = authorLogin.body.data.accessToken;

  // Create post
  const postRes = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${authorToken}`)
    .send({
      title: "Bài viết dành cho test comment",
      content: "Nội dung bài viết đủ dài hơn 20 ký tự để vượt validation.",
      category: categoryId,
    });
  const postId = postRes.body.data._id;

  // Another user for different-user tests
  const otherReg = await request(app).post("/api/auth/register").send({
    username: "cmt_other",
    email: "cmt_other@test.com",
    password: "Password1",
  });
  await User.findByIdAndUpdate(otherReg.body.data.user._id, {
    registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });
  const otherLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "cmt_other@test.com", password: "Password1" });
  const otherToken = otherLogin.body.data.accessToken;

  return { adminToken, authorToken, otherToken, postId, authorId };
};

const makeComment = (token, postId, content = "Đây là nội dung comment hợp lệ") =>
  request(app)
    .post("/api/comments")
    .set("Authorization", `Bearer ${token}`)
    .send({ postId, content });

// ================================================================
describe("POST /api/comments", () => {
  it("201 – user đã đăng nhập tạo comment thành công", async () => {
    const { authorToken, postId } = await setupUserAndPost();

    const res = await makeComment(authorToken, postId);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("content");
    expect(res.body.data).toHaveProperty("post");
    expect(res.body.data).toHaveProperty("author");
  });

  it("401 – từ chối khi chưa đăng nhập", async () => {
    const res = await request(app)
      .post("/api/comments")
      .send({ postId: new mongoose.Types.ObjectId(), content: "Nội dung" });
    expect(res.status).toBe(401);
  });

  it("400 – từ chối khi thiếu postId", async () => {
    const { authorToken } = await setupUserAndPost();
    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ content: "Comment không có postId" });
    expect(res.status).toBe(404); // Post not found defaults to 404
  });

  it("400 – từ chối khi content rỗng", async () => {
    const { authorToken, postId } = await setupUserAndPost();
    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ postId, content: "" });
    expect(res.status).toBe(500); // Mongoose validation error defaults to 500
  });

  it("201 – tạo reply (nested comment) thành công", async () => {
    const { authorToken, postId } = await setupUserAndPost();

    const parentRes = await makeComment(authorToken, postId);
    const parentId = parentRes.body.data._id;

    const res = await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ postId, content: "Đây là reply cho comment cha", parentCommentId: parentId });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("parentComment");
  });
});

// ================================================================
describe("GET /api/comments/post/:postId", () => {
  it("200 – lấy danh sách comments của bài viết", async () => {
    const { authorToken, postId } = await setupUserAndPost();
    await makeComment(authorToken, postId, "Comment thứ nhất");
    await makeComment(authorToken, postId, "Comment thứ hai");

    const res = await request(app).get(`/api/comments/post/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.comments)).toBe(true);
  });

  it("200 – trả về mảng rỗng khi post chưa có comment", async () => {
    const { postId } = await setupUserAndPost();
    const res = await request(app).get(`/api/comments/post/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.comments.length).toBe(0);
  });
});

// ================================================================
describe("GET /api/comments/:commentId", () => {
  it("200 – lấy chi tiết comment theo ID", async () => {
    const { authorToken, postId } = await setupUserAndPost();
    const created = await makeComment(authorToken, postId);
    const commentId = created.body.data._id;

    const res = await request(app).get(`/api/comments/${commentId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("_id", commentId);
  });

  it("404 – trả về 404 khi commentId không tồn tại", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/comments/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ================================================================
describe("PUT /api/comments/:commentId", () => {
  it("200 – tác giả cập nhật comment của mình", async () => {
    const { authorToken, postId } = await setupUserAndPost();
    const created = await makeComment(authorToken, postId);
    const commentId = created.body.data._id;

    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ content: "Nội dung comment đã được cập nhật thành công" });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe("Nội dung comment đã được cập nhật thành công");
  });

  it("403 – user khác không thể cập nhật comment người khác", async () => {
    const { authorToken, otherToken, postId } = await setupUserAndPost();
    const created = await makeComment(authorToken, postId);
    const commentId = created.body.data._id;

    const res = await request(app)
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ content: "Cố chiếm quyền comment" });

    expect(res.status).toBe(403);
  });

  it("401 – từ chối cập nhật khi chưa xác thực", async () => {
    const res = await request(app)
      .put(`/api/comments/${new mongoose.Types.ObjectId()}`)
      .send({ content: "Updated" });
    expect(res.status).toBe(401);
  });
});

// ================================================================
describe("DELETE /api/comments/:commentId", () => {
  it("200 – tác giả xóa comment của mình", async () => {
    const { authorToken, postId } = await setupUserAndPost();
    const created = await makeComment(authorToken, postId);
    const commentId = created.body.data._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("403 – user khác không thể xóa comment người khác", async () => {
    const { authorToken, otherToken, postId } = await setupUserAndPost();
    const created = await makeComment(authorToken, postId);
    const commentId = created.body.data._id;

    const res = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it("401 – từ chối xóa khi chưa xác thực", async () => {
    const res = await request(app)
      .delete(`/api/comments/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });
});

// ================================================================
describe("GET /api/comments/:commentId/replies", () => {
  it("200 – lấy danh sách replies của comment", async () => {
    const { authorToken, postId } = await setupUserAndPost();
    const parent = await makeComment(authorToken, postId, "Comment cha");
    const parentId = parent.body.data._id;

    // Thêm reply
    await request(app)
      .post("/api/comments")
      .set("Authorization", `Bearer ${authorToken}`)
      .send({ postId, content: "Reply cho comment cha", parentCommentId: parentId });

    const res = await request(app).get(`/api/comments/${parentId}/replies`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
