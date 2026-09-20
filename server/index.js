import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import cropAdviceRoutes from "./routes/cropAdviceRoutes.js";
import pestDetectionRoutes from "./routes/pestDetectionRoutes.js";
import mandiRoutes from "./routes/mandiRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(helmet());

app.use(express.json({ limit: '10mb' }));
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // har user/IP 15 min mein max 20 requests
  message: { success: false, error: "Too many requests. Please try again later." }
});

app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/crop-advice", aiLimiter, cropAdviceRoutes);
app.use("/api/pest-detection",aiLimiter, pestDetectionRoutes);
app.use("/api/live-mandi-prices", mandiRoutes);


if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
} else {
  console.log("✅ Gemini API Key Loaded");
}

const PORT = process.env.PORT || 5001;
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});