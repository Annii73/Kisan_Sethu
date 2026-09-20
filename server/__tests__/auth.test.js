import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "../routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = "password123";
const testName = "Test User";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  // Test user cleanup
  await mongoose.connection.collection("users").deleteOne({ email: testEmail });
  await mongoose.connection.close();
});

describe("Auth Routes", () => {
  
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: testName, email: testEmail, password: testPassword });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it("should fail with duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: testName, email: testEmail, password: testPassword });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("User already exists");
    });

    it("should fail with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: testName, email: "notanemail", password: testPassword });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Valid email is required");
    });

    it("should fail with short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: testName, email: "new@example.com", password: "123" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Password must be at least 6 characters");
    });

    it("should fail with missing name", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@example.com", password: testPassword });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Name is required");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: testPassword });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it("should fail with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "wrongpassword" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid Credentials");
    });

    it("should fail with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nouser@example.com", password: testPassword });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("User not found");
    });

    it("should fail with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "notanemail", password: testPassword });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Valid email is required");
    });
  });

});