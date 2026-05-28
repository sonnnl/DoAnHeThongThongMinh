const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("DB Model: Post constraints", () => {
  let mongo;

  beforeAll(async () => {
    mongoose.set("autoIndex", false);
    mongoose.set("autoCreate", false);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "jest-db" });
  });

  beforeEach(async () => {
    // Index tối thiểu để test unique slug
    await mongoose.connection.collection("posts").createIndex(
      { slug: 1 },
      { unique: true },
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it("blocks duplicate post.slug (E11000)", async () => {
    const User = require("../models/User");
    const Category = require("../models/Category");
    const Post = require("../models/Post");

    const user = await User.create({
      username: "author_one",
      email: "author_one@example.com",
      password: "12345678",
    });

    const category = await Category.create({
      name: "Test Category",
      slug: "test-category",
    });

    const basePost = {
      title: "Bài viết mẫu có tiêu đề đủ dài",
      content: "Nội dung mẫu đủ dài để vượt minlength của schema post.",
      author: user._id,
      category: category._id,
      slug: "same-slug",
    };

    await Post.create(basePost);

    await expect(Post.create({ ...basePost, title: "Tiêu đề khác nhưng slug trùng" }))
      .rejects.toMatchObject({ code: 11000 });
  });

  it("validates post.title minlength", async () => {
    const User = require("../models/User");
    const Category = require("../models/Category");
    const Post = require("../models/Post");

    const user = await User.create({
      username: "author_two",
      email: "author_two@example.com",
      password: "12345678",
    });

    const category = await Category.create({
      name: "Test Category 2",
      slug: "test-category-2",
    });

    await expect(
      Post.create({
        title: "Ngắn", // minlength: 10
        content: "Nội dung mẫu đủ dài để vượt minlength của schema post.",
        author: user._id,
        category: category._id,
        slug: "slug-title-too-short",
      }),
    ).rejects.toBeTruthy();
  });
});

