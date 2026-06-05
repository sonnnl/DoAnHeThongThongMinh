/**
 * FILE: __dbtests__/db.user.methods.test.js
 * MỤC ĐÍCH: DB integration tests cho User model methods
 * Kiểm tra: badge logic, canCreatePost, canCreateComment, block/unblock
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("DB Model: User methods và business logic", () => {
  let mongo;
  let User;

  beforeAll(async () => {
    mongoose.set("autoIndex", false);
    mongoose.set("autoCreate", false);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "jest-user-methods" });
    User = require("../models/User");
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  const createUser = (overrides = {}) =>
    User.create({
      username: `user_${Math.random().toString(36).slice(2, 8)}`,
      email: `${Math.random().toString(36).slice(2)}@test.com`,
      password: "Aa123456",
      ...overrides,
    });

  // ================================================================
  describe("comparePassword", () => {
    it("trả về true với mật khẩu đúng", async () => {
      const user = await createUser({ password: "Aa123456" });
      const fetched = await User.findById(user._id).select("+password");
      expect(await fetched.comparePassword("Aa123456")).toBe(true);
    });

    it("trả về false với mật khẩu sai", async () => {
      const user = await createUser({ password: "Aa123456" });
      const fetched = await User.findById(user._id).select("+password");
      expect(await fetched.comparePassword("WrongPass1")).toBe(false);
    });
  });

  // ================================================================
  describe("updateBadge – logic phân hạng tự động", () => {
    it('gán "Xem chùa" khi < 5 posts và < 10 comments', () => {
      const user = new User({ username: "a", email: "a@t.com", password: "Aa1" });
      user.stats.postsCount = 2;
      user.stats.commentsCount = 5;
      user.updateBadge();
      expect(user.badge).toBe("Xem chùa");
    });

    it('gán "Newbie" khi 5–9 posts và 10–49 comments', () => {
      const user = new User({ username: "b", email: "b@t.com", password: "Aa1" });
      user.stats.postsCount = 7;
      user.stats.commentsCount = 20;
      user.updateBadge();
      expect(user.badge).toBe("Newbie");
    });

    it('gán "Người từng trải" khi 10–49 posts và 50–199 comments', () => {
      const user = new User({ username: "c", email: "c@t.com", password: "Aa1" });
      user.stats.postsCount = 25;
      user.stats.commentsCount = 100;
      user.updateBadge();
      expect(user.badge).toBe("Người từng trải");
    });

    it('gán "Chuyên gia" khi >= 50 posts', () => {
      const user = new User({ username: "d", email: "d@t.com", password: "Aa1" });
      user.stats.postsCount = 50;
      user.stats.commentsCount = 200;
      user.updateBadge();
      expect(user.badge).toBe("Chuyên gia");
    });

    it('gán "Chuyên gia" khi >= 500 upvotesReceived', () => {
      const user = new User({ username: "e", email: "e@t.com", password: "Aa1" });
      user.stats.postsCount = 50;
      user.stats.commentsCount = 200;
      user.stats.upvotesReceived = 500;
      user.updateBadge();
      expect(user.badge).toBe("Chuyên gia");
    });

    it('gán "Người dùng bị hạn chế" khi >= 5 reportsAccepted', () => {
      const user = new User({ username: "f", email: "f@t.com", password: "Aa1" });
      user.stats.postsCount = 50;
      user.stats.commentsCount = 200;
      user.stats.reportsAccepted = 5;
      user.updateBadge();
      expect(user.badge).toBe("Người dùng bị hạn chế");
    });
  });

  // ================================================================
  describe("canCreatePost", () => {
    it("cho phép admin bỏ qua mọi hạn chế", () => {
      const user = new User({
        username: "adm", email: "adm@t.com", password: "Aa1",
        role: "admin",
        registeredAt: new Date(),
        stats: { commentsCount: 0 },
      });
      expect(user.canCreatePost().allowed).toBe(true);
    });

    it("từ chối user mới đăng ký chưa đủ 1 tiếng", () => {
      const user = new User({
        username: "new", email: "new@t.com", password: "Aa1",
        role: "user",
        registeredAt: new Date(),
        stats: { commentsCount: 5 },
      });
      const result = user.canCreatePost();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("1 tiếng");
    });

    it("từ chối user có < 3 comments", () => {
      const user = new User({
        username: "lc", email: "lc@t.com", password: "Aa1",
        role: "user",
        registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
        stats: { commentsCount: 2 },
      });
      const result = user.canCreatePost();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("3 lần");
    });

    it("từ chối user có restrictions.canPost = false", () => {
      const user = new User({
        username: "res", email: "res@t.com", password: "Aa1",
        role: "user",
        registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        stats: { commentsCount: 5 },
        restrictions: { canPost: false, canComment: true },
      });
      const result = user.canCreatePost();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("hạn chế");
    });

    it("từ chối user đang bị ban", () => {
      const user = new User({
        username: "ban", email: "ban@t.com", password: "Aa1",
        role: "user",
        registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        stats: { commentsCount: 5 },
        restrictions: {
          canPost: true,
          canComment: true,
          bannedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          banReason: "Spam",
        },
      });
      const result = user.canCreatePost();
      expect(result.allowed).toBe(false);
    });

    it("cho phép user bình thường đủ điều kiện", () => {
      const user = new User({
        username: "ok", email: "ok@t.com", password: "Aa1",
        role: "user",
        registeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        stats: { commentsCount: 5 },
        restrictions: { canPost: true, canComment: true, bannedUntil: null },
      });
      expect(user.canCreatePost().allowed).toBe(true);
    });
  });

  // ================================================================
  describe("canCreateComment", () => {
    it("cho phép user bình thường", () => {
      const user = new User({
        username: "cmt1", email: "cmt1@t.com", password: "Aa1",
        restrictions: { canComment: true, canPost: true },
      });
      expect(user.canCreateComment().allowed).toBe(true);
    });

    it("từ chối user bị hạn chế comment", () => {
      const user = new User({
        username: "cmt2", email: "cmt2@t.com", password: "Aa1",
        restrictions: { canComment: false, canPost: true },
      });
      const result = user.canCreateComment();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("hạn chế comment");
    });

    it("từ chối user đang bị ban", () => {
      const user = new User({
        username: "cmt3", email: "cmt3@t.com", password: "Aa1",
        restrictions: {
          canComment: true,
          bannedUntil: new Date(Date.now() + 60000),
          banReason: "Hate speech",
        },
      });
      expect(user.canCreateComment().allowed).toBe(false);
    });
  });

  // ================================================================
  describe("blockUser / unblockUser / isBlocked", () => {
    it("blockUser thêm userId vào blockedUsers", async () => {
      const u1 = await createUser();
      const u2 = await createUser();

      await u1.blockUser(u2._id);
      expect(u1.isBlocked(u2._id)).toBe(true);
    });

    it("blockUser không thêm trùng lặp", async () => {
      const u1 = await createUser();
      const u2 = await createUser();

      await u1.blockUser(u2._id);
      await u1.blockUser(u2._id);
      expect(u1.blockedUsers.length).toBe(1);
    });

    it("unblockUser xóa userId khỏi blockedUsers", async () => {
      const u1 = await createUser();
      const u2 = await createUser();

      await u1.blockUser(u2._id);
      await u1.unblockUser(u2._id);
      expect(u1.isBlocked(u2._id)).toBe(false);
    });

    it("isBlocked trả về false khi user chưa bị block", async () => {
      const u1 = await createUser();
      const u2 = await createUser();
      expect(u1.isBlocked(u2._id)).toBe(false);
    });
  });

  // ================================================================
  describe("handleAcceptedReport", () => {
    it("sau 5 reports được duyệt: tự động ban và cập nhật badge", () => {
      const user = new User({
        username: "rep", email: "rep@t.com", password: "Aa1",
        stats: { reportsAccepted: 4, postsCount: 0, commentsCount: 0, upvotesReceived: 0 },
        restrictions: { canComment: true, canPost: true },
      });
      user.handleAcceptedReport();
      expect(user.stats.reportsAccepted).toBe(5);
      expect(user.restrictions.canComment).toBe(false);
      expect(user.restrictions.bannedUntil).not.toBeNull();
      expect(user.badge).toBe("Người dùng bị hạn chế");
    });
  });

  // ================================================================
  describe("Virtual: score và daysJoined", () => {
    it("score = upvotesReceived - downvotesReceived", () => {
      const user = new User({ username: "sc", email: "sc@t.com", password: "Aa1" });
      user.stats.upvotesReceived = 80;
      user.stats.downvotesReceived = 30;
      expect(user.score).toBe(50);
    });

    it("daysJoined >= 1 sau khi tạo tài khoản", async () => {
      const user = await createUser();
      expect(user.daysJoined).toBeGreaterThanOrEqual(1);
    });
  });
});
