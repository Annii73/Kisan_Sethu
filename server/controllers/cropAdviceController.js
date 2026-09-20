import { GoogleGenAI } from "@google/genai";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const CACHE_TTL = 2 * 60 * 60;

function getRedisClient() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCacheKey(query) {
  const normalized = normalizeQuery(query);
  const hash = crypto.createHash("md5").update(normalized).digest("hex");
  return `crop_advice:${hash}`;
}

export const getCropAdvice = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: "Server is missing GEMINI_API_KEY" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const redis = getRedisClient();

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    // Step 1 — Redis cache check
    const cacheKey = getCacheKey(prompt);
    const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse) {
      console.log("✅ Cache hit for crop advice query");
      return res.json({ success: true, text: cachedResponse, cached: true });
    }

    // Step 2 — Single Gemini call: validation + response combined
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            valid: { type: "boolean" },
            reason: { type: "string" },
            answer: { type: "string" }
          },
          required: ["valid", "reason", "answer"]
        },
        systemInstruction: `You are an expert Indian agriculture advisor (Kisaan Sethu AI).
Rules:
1. If the query is NOT related to farming, crops, soil, pest control, irrigation, weather for farming, or government agricultural schemes — set valid=false, reason=explain why, answer="".
2. If the query IS farming related — set valid=true, reason="", answer=detailed practical advice for Indian farmers.
Always respond in the same language as the user's query (Hindi or English).`
      }
    });

    const parsed = JSON.parse(response.text);

    if (!parsed.valid) {
      return res.status(400).json({
        success: false,
        error: "I can only help with farming and agriculture related questions.",
        reason: parsed.reason
      });
    }

    // Step 3 — Redis mein save karo
    await redis.set(cacheKey, parsed.answer, { ex: CACHE_TTL });
    console.log("✅ Cached new crop advice response");

    res.json({ success: true, text: parsed.answer, cached: false });
  } catch (error) {
    console.error("Gemini SDK Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate response" });
  }
};