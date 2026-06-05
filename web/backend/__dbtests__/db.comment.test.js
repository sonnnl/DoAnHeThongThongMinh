/**
 * FILE: __dbtests__/db.comment.test.js
 * MỤC ĐÍCH: DB integration tests cho Comment model
 * Kiểm tra: softDelete, vote methods, netVotes virtual, score calculation
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("DB Model: Comment methods và constraints", () => {
  let mongo;
  let User, Post, Comment, Category;

  beforeAll(async () => {
    mongoose.set("autoIndex", false);
    mongoose.set("autoCreate", false);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "jest-comment" });

    User = require("../models/User");
    Post = require("../models/Post");
    Comment = require("../models/Comment");
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
    User.create({ username: `u_${suffix}`, email: `${suffix}@t.com`, password: "Aa123456" });

  const makeCategory = (suffix) =>
    Category.create({ name: `Cat ${suffix}`, slug: `cat-${suffix}-${Date.now()}` });

  const makePost = (userId, catId) =>
    Post.create({
      title: "Tiêu đề bài viết đủ dài để test comment",
      content: "Nội dung bài viết đủ dài hơn 20 ký tự để vượt qua validation.",
      author: userId,
      category: catId,
      slug: `slug-${Math.random().toString(36).slice(2)}`,
    });

  const makeComment = (userId, postId, content = "Nội dung comment đủ dài") =>
    Comment.create({ content, author: userId, post: postId });

  // ================================================================
  describe("Tạo comment – validation", () => {
    it("tạo comment thành công với dữ liệu hợp lệ", async () => {
      const user = await makeUser("c1");
      const cat = await makeCategory("c1");
      const post = await makePost(user._id, cat._id);

      const comment = await makeComment(user._id, post._id);
      expect(comment._id).toBeDefined();
      expect(comment.content).toBe("Nội dung comment đủ dài");
      expect(comment.stats.upvotes).toBe(0);
      expect(comment.stats.downvotes).toBe(0);
      expect(comment.isDeleted).toBe(false);
    });

    it("từ chối comment không có author", async () => {
      const cat = await makeCategory("c2");
      const user = await makeUser("c2");
      const post = await makePost(user._id, cat._id);

      await expect(
        Comment.create({ content: "Test", post: post._id })
      ).rejects.toBeTruthy();
    });

    it("từ chối comment không có post", async () => {
      const user = await makeUser("c3");

      await expect(
        Comment.create({ content: "Test", author: user._id })
      ).rejects.toBeTruthy();
    });
  });

  // ================================================================
  describe("softDelete method", () => {
    it("soft-delete comment không có replies: đánh dấu isDeleted và xoá content", async () => {
      const user = await makeUser("sd1");
      const cat = await makeCategory("sd1");
      const post = await makePost(user._id, cat._id);
      // bump commentsCount on post to avoid negative
      await Post.findByIdAndUpdate(post._id, { $inc: { "stats.commentsCount": 1 } });
      const comment = await makeComment(user._id, post._id);

      await comment.softDelete(user._id);

      expect(comment.isDeleted).toBe(true);
      expect(comment.content).toBe("");
      expect(comment.deletedBy.toString()).toBe(user._id.toString());
    });

    it("soft-delete comment có replies: giữ cấu trúc, đặt deletedMessage", async () => {
      const user = await makeUser("sd2");
      const cat = await makeCategory("sd2");
      const post = await makePost(user._id, cat._id);
      await Post.findByIdAndUpdate(post._id, { $inc: { "stats.commentsCount": 2 } });

      const parent = await makeComment(user._id, post._id, "Comment gốc");
      // Tạo reply
      await Comment.create({ content: "Reply của comment gốc", author: user._id, post: post._id, parentComment: parent._id });

      await parent.softDelete(user._id);

      expect(parent.isDeleted).toBe(true);
      expect(parent.content).toBe("");
      expect(parent.deletedMessage).toBe("[Bình luận này đã bị xóa]");
    });
  });

  // ================================================================
  describe("addUpvote / removeUpvote / addDownvote / removeDownvote", () => {
    it("addUpvote tăng stats.upvotes lên 1", async () => {
      const user = await makeUser("up1");
      const cat = await makeCategory("up1");
      const post = await makePost(user._id, cat._id);
      const comment = await makeComment(user._id, post._id);

      await comment.addUpvote();
      const refreshed = await Comment.findById(comment._id);
      expect(refreshed.stats.upvotes).toBe(1);
    });

    it("removeUpvote không giảm xuống dưới 0", async () => {
      const user = await makeUser("up2");
      const cat = await makeCategory("up2");
      const post = await makePost(user._id, cat._id);
      const comment = await makeComment(user._id, post._id);

      // upvotes đang là 0
      await comment.removeUpvote();
      const refreshed = await Comment.findById(comment._id);
      expect(refreshed.stats.upvotes).toBe(0);
    });

    it("addDownvote tăng stats.downvotes lên 1", async () => {
      const user = await makeUser("dv1");
      const cat = await makeCategory("dv1");
      const post = await makePost(user._id, cat._id);
      const comment = await makeComment(user._id, post._id);

      await comment.addDownvote();
      const refreshed = await Comment.findById(comment._id);
      expect(refreshed.stats.downvotes).toBe(1);
    });

    it("addUpvote sau đó removeUpvote: upvotes về 0", async () => {
      const user = await makeUser("updown");
      const cat = await makeCategory("updown");
      const post = await makePost(user._id, cat._id);
      const comment = await makeComment(user._id, post._id);

      await comment.addUpvote();
      const afterAdd = await Comment.findById(comment._id);
      await afterAdd.removeUpvote();
      const final = await Comment.findById(comment._id);
      expect(final.stats.upvotes).toBe(0);
    });
  });

  // ================================================================
  describe("Virtual: netVotes", () => {
    it("netVotes = upvotes - downvotes", () => {
      const comment = new Comment({ content: "test", author: new mongoose.Types.ObjectId(), post: new mongoose.Types.ObjectId() });
      comment.stats.upvotes = 10;
      comment.stats.downvotes = 3;
      expect(comment.netVotes).toBe(7);
    });

    it("netVotes âm khi downvotes > upvotes", () => {
      const comment = new Comment({ content: "test", author: new mongoose.Types.ObjectId(), post: new mongoose.Types.ObjectId() });
      comment.stats.upvotes = 2;
      comment.stats.downvotes = 8;
      expect(comment.netVotes).toBe(-6);
    });
  });

  // ================================================================
  describe("Nested replies – depth và parentComment", () => {
    it("tạo reply với parentComment hợp lệ", async () => {
      const user = await makeUser("nest1");
      const cat = await makeCategory("nest1");
      const post = await makePost(user._id, cat._id);
      const parent = await makeComment(user._id, post._id, "Comment cha");

      const reply = await Comment.create({
        content: "Reply con",
        author: user._id,
        post: post._id,
        parentComment: parent._id,
        depth: 1,
      });

      expect(reply.parentComment.toString()).toBe(parent._id.toString());
      expect(reply.depth).toBe(1);
    });
  });
});
