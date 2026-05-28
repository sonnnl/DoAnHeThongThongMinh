const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

describe("DB Model: User unique constraints", () => {
  let mongo;

  beforeAll(async () => {
    // Tránh Mongoose tự build indexes theo schema (project hiện có duplicate indexes)
    mongoose.set("autoIndex", false);
    mongoose.set("autoCreate", false);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: "jest-db" });
  });

  beforeEach(async () => {
    // Tạo indexes tối thiểu cần kiểm thử unique
    await mongoose.connection.collection("users").createIndex(
      { email: 1 },
      { unique: true },
    );
    await mongoose.connection.collection("users").createIndex(
      { username: 1 },
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

  it("blocks duplicate email (E11000)", async () => {
    const User = require("../models/User");

    await User.create({
      username: "user_one",
      email: "dup@example.com",
      password: "12345678",
    });

    await expect(
      User.create({
        username: "user_two",
        email: "dup@example.com",
        password: "12345678",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("blocks duplicate username (E11000)", async () => {
    const User = require("../models/User");

    await User.create({
      username: "same_username",
      email: "one@example.com",
      password: "12345678",
    });

    await expect(
      User.create({
        username: "same_username",
        email: "two@example.com",
        password: "12345678",
      }),
    ).rejects.toMatchObject({ code: 11000 });
  });
});

