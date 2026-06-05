/**
 * FILE: __dbtests__/db.vote.test.js
 * MỤC ĐÍCH: DB integration tests cho Vote model
 * Kiểm tra: compound unique index, enum validation, static methods
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("DB Model: Vote constraints và static methods", () => {
  let mongo;
  let User, Vote, Post, Category;

  beforeAll(async () => {
    mongoose.set("autoIndex", false);
    mongoose.set("autoCreate", false);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "jest-vote" });

    User = require("../models/User");
    Vote = require("../models/Vote");
    Post = require("../models/Post");
    Category = require("../models/Category");
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  // ---- helpers ----
  const makeUser = (suffix) =>
    User.create({ username: `u_${suffix}`, email: `u${suffix}@test.com`, password: "Aa123456" });

  const makePost = (userId, catId) =>
    Post.create({
      title: "Tiêu đề bài viết đủ dài để test",
      content: "Nội dung đủ dài để vượt qua minlength 20 ký tự.",
      author: userId,
      category: catId,
      slug: `slug-${Math.random().toString(36).slice(2)}`,
    });

  const makeCategory = (suffix) =>
    Category.create({ name: `Cat ${suffix}`, slug: `cat-${suffix}` });

  // ================================================================
  describe("Compound unique index: mỗi user chỉ vote 1 lần / target", () => {
    beforeEach(async () => {
      await mongoose.connection.collection("votes").createIndex(
        { user: 1, targetType: 1, targetId: 1 },
        { unique: true }
      );
    });

    it("chặn vote trùng lặp cùng user + targetType + targetId (E11000)", async () => {
      const user = await makeUser("dup1");
      const cat = await makeCategory("v1");
      const post = await makePost(user._id, cat._id);

      await Vote.create({ user: user._id, targetType: "Post", targetId: post._id, voteType: "upvote" });

      await expect(
        Vote.create({ user: user._id, targetType: "Post", targetId: post._id, voteType: "downvote" })
      ).rejects.toMatchObject({ code: 11000 });
    });

    it("cho phép 2 user khác nhau vote cùng một post", async () => {
      const u1 = await makeUser("v2a");
      const u2 = await makeUser("v2b");
      const cat = await makeCategory("v2");
      const post = await makePost(u1._id, cat._id);

      const v1 = await Vote.create({ user: u1._id, targetType: "Post", targetId: post._id, voteType: "upvote" });
      const v2 = await Vote.create({ user: u2._id, targetType: "Post", targetId: post._id, voteType: "upvote" });

      expect(v1._id).toBeDefined();
      expect(v2._id).toBeDefined();
    });

    it("cho phép cùng user vote vào Post và Comment khác nhau (targetType khác)", async () => {
      const user = await makeUser("v3");
      const cat = await makeCategory("v3");
      const post = await makePost(user._id, cat._id);
      const comment = await mongoose.connection.collection("comments").insertOne({ _id: new mongoose.Types.ObjectId() });

      const v1 = await Vote.create({ user: user._id, targetType: "Post", targetId: post._id, voteType: "upvote" });
      const v2 = await Vote.create({ user: user._id, targetType: "Comment", targetId: comment.insertedId, voteType: "upvote" });

      expect(v1._id).toBeDefined();
      expect(v2._id).toBeDefined();
    });
  });

  // ================================================================
  describe("Enum validation", () => {
    it("từ chối voteType không hợp lệ", async () => {
      const user = await makeUser("enum1");
      const cat = await makeCategory("enum1");
      const post = await makePost(user._id, cat._id);

      await expect(
        Vote.create({ user: user._id, targetType: "Post", targetId: post._id, voteType: "neutral" })
      ).rejects.toBeTruthy();
    });

    it("từ chối targetType không hợp lệ", async () => {
      const user = await makeUser("enum2");
      const cat = await makeCategory("enum2");
      const post = await makePost(user._id, cat._id);

      await expect(
        Vote.create({ user: user._id, targetType: "Category", targetId: post._id, voteType: "upvote" })
      ).rejects.toBeTruthy();
    });

    it("chấp nhận voteType hợp lệ: upvote và downvote", async () => {
      const u1 = await makeUser("valid1");
      const u2 = await makeUser("valid2");
      const cat = await makeCategory("valid");
      const post = await makePost(u1._id, cat._id);

      const up = await Vote.create({ user: u1._id, targetType: "Post", targetId: post._id, voteType: "upvote" });
      const down = await Vote.create({ user: u2._id, targetType: "Post", targetId: post._id, voteType: "downvote" });

      expect(up.voteType).toBe("upvote");
      expect(down.voteType).toBe("downvote");
    });
  });

  // ================================================================
  describe("Static method: getUserVote", () => {
    it("trả về voteType khi user đã vote", async () => {
      const user = await makeUser("gv1");
      const cat = await makeCategory("gv1");
      const post = await makePost(user._id, cat._id);

      await Vote.create({ user: user._id, targetType: "Post", targetId: post._id, voteType: "upvote" });

      const result = await Vote.getUserVote(user._id, "Post", post._id);
      expect(result).toBe("upvote");
    });

    it("trả về null khi user chưa vote", async () => {
      const user = await makeUser("gv2");
      const fakeId = new mongoose.Types.ObjectId();

      const result = await Vote.getUserVote(user._id, "Post", fakeId);
      expect(result).toBeNull();
    });
  });
});
