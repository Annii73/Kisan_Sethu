import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
//import getMandiPrices from "./scrapers/mandiScraper.js";

async function getMandiPricesFromDataGov() {
  const apiKey = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";
  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=100`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`data.gov.in API failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    throw new Error("No records returned from data.gov.in");
  }

  return data.records.map(r => ({
    state: r.state || "",
    district: r.district || "",
    market: r.market || "",
    commodity: r.commodity || "",
    variety: r.variety || "",
    minPrice: Number(r.min_price) || 0,
    maxPrice: Number(r.max_price) || 0,
    modalPrice: Number(r.modal_price) || 0,
    date: r.arrival_date || new Date().toISOString().split("T")[0],
    scrapedAt: new Date().toISOString(),
  }));
}


dotenv.config();
connectDB();
// Cache for mandi prices (2 hours)
let mandiPricesCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 2 * 60 * 60 * 1000
};
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb'}));

app.use("/api/auth", authRoutes);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
} else {
  console.log("✅ Gemini API Key Loaded");
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

app.post("/api/crop-advice", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Server is missing GEMINI_API_KEY",
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    res.json({
      success: true,
      text: response.text,
    });
  } catch (error) {
    console.error("❌ Gemini SDK Error:");
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate response",
    });
  }
});

app.post("/api/pest-detection", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Server is missing GEMINI_API_KEY",
    });
  }

  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Image is required",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert plant pathologist for Indian farmers. Analyze this plant/crop image and identify any disease or pest issue. Respond ONLY in valid JSON, no markdown, in this exact format:
{
  "diseaseName": "name of disease or 'Healthy Plant' if no issue found",
  "confidence": <number 0-100>,
  "description": "brief description of the issue",
  "symptoms": ["symptom1", "symptom2", "symptom3"],
  "organicTreatments": ["treatment1", "treatment2", "treatment3"],
  "chemicalTreatments": ["treatment1", "treatment2"]
}`
            },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: image
              }
            }
          ]
        }
      ]
    });

    let text = response.text.trim();
    // Remove markdown code fences if Gemini wraps the JSON in them
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');

    const parsed = JSON.parse(text);

    res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("❌ Pest Detection Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze image",
    });
  }
});

const PORT = process.env.PORT || 5001;
app.get("/api/live-mandi-prices", async (req, res) => {
  try {
    const now = Date.now();

    if (
      mandiPricesCache.data &&
      mandiPricesCache.timestamp &&
      (now - mandiPricesCache.timestamp) < mandiPricesCache.CACHE_DURATION
    ) {
      return res.json({
        success: true,
        data: mandiPricesCache.data,
        cached: true,
        timestamp: new Date(mandiPricesCache.timestamp).toISOString()
      });
    }

    const prices = await getMandiPricesFromDataGov();

    if (!prices || prices.length === 0) {
      if (mandiPricesCache.data) {
        return res.json({
          success: true,
          data: mandiPricesCache.data,
          cached: true,
          stale: true,
          timestamp: new Date(mandiPricesCache.timestamp).toISOString(),
          message: "Using cached data - live data unavailable"
        });
      }
      return res.status(500).json({
        success: false,
        error: "Failed to fetch mandi prices. Please try again later."
      });
    }

    mandiPricesCache.data = prices;
    mandiPricesCache.timestamp = now;

    res.json({
      success: true,
      data: prices,
      cached: false,
      timestamp: new Date(now).toISOString()
    });

  } catch (error) {
    console.error("Error in /api/live-mandi-prices:", error);
    if (mandiPricesCache.data) {
      return res.json({
        success: true,
        data: mandiPricesCache.data,
        cached: true,
        stale: true,
        timestamp: new Date(mandiPricesCache.timestamp).toISOString(),
        message: "Using cached data due to error"
      });
    }
    res.status(500).json({
      success: false,
      error: "Live data unavailable — please try again later.",
      details: error.message
    });
  }
});
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
app.get("/api/models", async (req, res) => {
  try {
    const models = await ai.models.list();

    res.json(models);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});