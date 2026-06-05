const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Category = require("../models/Category");
const User = require("../models/User");

describe("DB Model: Category constraints and methods", () => {
  let mongo;

  beforeAll(async () => {
    mongoose.set("autoIndex", false);
    mongoose.set("autoCreate", false);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "jest-db-category" });
  });

  beforeEach(async () => {
    // Tạo index duy nhất cho name và slug để test uniqueness
    await mongoose.connection.collection("categories").createIndex(
      { name: 1 },
      { unique: true }
    );
    await mongoose.connection.collection("categories").createIndex(
      { slug: 1 },
      { unique: true }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it("automatically generates slug from name on save", async () => {
    const category = new Category({
      name: "Cộng Đồng Lập Trình Viên Việt Nam!",
      slug: "temp-slug",
    });
    await category.save();

    expect(category.slug).toBe("cong-dong-lap-trinh-vien-viet-nam");
  });

  it("blocks duplicate category names", async () => {
    await Category.create({
      name: "Duplicate Name",
      slug: "dup-1",
    });

    await expect(
      Category.create({
        name: "Duplicate Name",
        slug: "dup-2",
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("cascades post counts to parent category on increment and decrement", async () => {
    const parent = await Category.create({
      name: "Lập trình",
      slug: "lap-trinh",
    });

    const child = await Category.create({
      name: "Javascript",
      slug: "javascript",
      parentCategory: parent._id,
    });

    // Increment child
    await child.incrementPostCount();

    // Reload parent and child
    const updatedChild = await Category.findById(child._id);
    const updatedParent = await Category.findById(parent._id);

    expect(updatedChild.stats.postsCount).toBe(1);
    expect(updatedParent.stats.postsCount).toBe(1);
    expect(updatedChild.lastPostAt).toBeInstanceOf(Date);
    expect(updatedParent.lastPostAt).toBeInstanceOf(Date);

    // Decrement child
    await updatedChild.decrementPostCount();
    const finalChild = await Category.findById(child._id);
    const finalParent = await Category.findById(parent._id);

    expect(finalChild.stats.postsCount).toBe(0);
    expect(finalParent.stats.postsCount).toBe(0);
  });

  describe("canUserPost method", () => {
    it("denies posting when category is inactive", async () => {
      const category = await Category.create({
        name: "Locked Zone",
        slug: "locked-zone",
        settings: { isActive: false },
      });

      const user = new User({
        username: "testuser",
        email: "test@example.com",
        stats: { upvotesReceived: 10, downvotesReceived: 0 },
      });

      const check = category.canUserPost(user);
      expect(check.allowed).toBe(false);
      expect(check.reason).toBe("Category này hiện không hoạt động");
    });

    it("denies posting when user does not have enough karma", async () => {
      const category = await Category.create({
        name: "Expert Zone",
        slug: "expert-zone",
        settings: { isActive: true, minKarmaToPost: 100 },
      });

      const user = new User({
        username: "newbie",
        email: "newbie@example.com",
        stats: { upvotesReceived: 50, downvotesReceived: 10 }, // 40 karma
      });

      const check = category.canUserPost(user);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain("Bạn cần có ít nhất 100 điểm");
    });

    it("allows posting when user meets all requirements", async () => {
      const category = await Category.create({
        name: "Standard Forum",
        slug: "standard-forum",
        settings: { isActive: true, minKarmaToPost: 20 },
      });

      const user = new User({
        username: "pro_user",
        email: "pro@example.com",
        stats: { upvotesReceived: 30, downvotesReceived: 5 }, // 25 karma
      });

      const check = category.canUserPost(user);
      expect(check.allowed).toBe(true);
    });
  });
});
