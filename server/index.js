import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import cropAdviceRoutes from "./routes/cropAdviceRoutes.js";
import pestDetectionRoutes from "./routes/pestDetectionRoutes.js";
import mandiRoutes from "./routes/mandiRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use("/api/feedback", feedbackRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/crop-advice", cropAdviceRoutes);
app.use("/api/pest-detection", pestDetectionRoutes);
app.use("/api/live-mandi-prices", mandiRoutes);


if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
} else {
  console.log("✅ Gemini API Key Loaded");
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});