/**
 * FILE: __tests__/api.votes.test.js
 * MỤC ĐÍCH: API Integration tests cho Vote endpoints
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
    username: "vote_admin",
    email: "vote_admin@test.com",
    password: "Password1",
  });
  await User.findByIdAndUpdate(adminReg.body.data.user._id, { role: "admin" });
  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "vote_admin@test.com", password: "Password1" });
  const adminToken = adminLogin.body.data.accessToken;

  const catRes = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Vote Test Category" });
  const categoryId = catRes.body.data._id;

  // Author user
  const authorReg = await request(app).post("/api/auth/register").send({
    username: "vote_author",
    email: "vote_author@test.com",
    password: "Password1",
  });
  const authorId = authorReg.body.data.user._id;
  await User.findByIdAndUpdate(authorId, {
    registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    "stats.commentsCount": 5,
  });
  const authorLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "vote_author@test.com", password: "Password1" });
  const authorToken = authorLogin.body.data.accessToken;

  // Create post
  const postRes = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${authorToken}`)
    .send({
      title: "Bài viết dành cho test voting",
      content: "Nội dung bài viết đủ dài hơn 20 ký tự để vượt validation.",
      category: categoryId,
    });
  const postId = postRes.body.data._id;

  // Voter user
  const voterReg = await request(app).post("/api/auth/register").send({
    username: "vote_voter",
    email: "vote_voter@test.com",
    password: "Password1",
  });
  const voterLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "vote_voter@test.com", password: "Password1" });
  const voterToken = voterLogin.body.data.accessToken;

  return { authorToken, voterToken, postId };
};

// ================================================================
describe("POST /api/votes", () => {
  it("200 – user upvote bài viết thành công", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    const res = await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${voterToken}`)
      .send({ targetId: postId, targetType: "Post", voteType: "upvote" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upvotes).toBe(1);
  });

  it("200 – user downvote bài viết thành công", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    const res = await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${voterToken}`)
      .send({ targetId: postId, targetType: "Post", voteType: "downvote" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.downvotes).toBe(1);
  });

  it("401 – từ chối khi chưa đăng nhập", async () => {
    const { postId } = await setupUserAndPost();
    const res = await request(app)
      .post("/api/votes")
      .send({ targetId: postId, targetType: "Post", voteType: "upvote" });

    expect(res.status).toBe(401);
  });

  it("400 – từ chối voteType không hợp lệ", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    const res = await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${voterToken}`)
      .send({ targetId: postId, targetType: "Post", voteType: "neutral" });

    expect(res.status).toBe(400);
  });
});

// ================================================================
describe("GET /api/votes/:contentType/:contentId", () => {
  it("200 – trả về null khi chưa vote", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    const res = await request(app)
      .get(`/api/votes/Post/${postId}`)
      .set("Authorization", `Bearer ${voterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.voteType).toBeNull();
  });

  it("200 – trả về voteType sau khi đã vote", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    // Vote trước
    await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${voterToken}`)
      .send({ targetId: postId, targetType: "Post", voteType: "upvote" });

    // Lấy trạng thái sau
    const res = await request(app)
      .get(`/api/votes/Post/${postId}`)
      .set("Authorization", `Bearer ${voterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.voteType).toBe("upvote");
  });
});

// ================================================================
describe("GET /api/votes/:contentType/:contentId/upvotes và /downvotes", () => {
  it("200 – lấy danh sách upvoters", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${voterToken}`)
      .send({ targetId: postId, targetType: "Post", voteType: "upvote" });

    const res = await request(app).get(`/api/votes/Post/${postId}/upvotes`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.length).toBe(1);
  });

  it("200 – lấy danh sách downvoters", async () => {
    const { voterToken, postId } = await setupUserAndPost();

    await request(app)
      .post("/api/votes")
      .set("Authorization", `Bearer ${voterToken}`)
      .send({ targetId: postId, targetType: "Post", voteType: "downvote" });

    const res = await request(app).get(`/api/votes/Post/${postId}/downvotes`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.users.length).toBe(1);
  });
});
