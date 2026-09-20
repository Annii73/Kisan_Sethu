import { GoogleGenAI } from "@google/genai";

export const getCropAdvice = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: "Server is missing GEMINI_API_KEY" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    // Step 1 — JSON Schema validation (guardrail)
    const validationResponse = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `You are a strict input validator for an Indian agriculture assistant. 
Analyze if this query is related to farming, crops, soil, pest control, irrigation, weather for farming, or government agricultural schemes.
Query: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            valid: { type: "boolean" },
            reason: { type: "string" }
          },
          required: ["valid", "reason"]
        }
      }
    });

    const validation = JSON.parse(validationResponse.text);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "I can only help with farming and agriculture related questions.",
        reason: validation.reason
      });
    }

    // Step 2 — Main response
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    res.json({ success: true, text: response.text });
  } catch (error) {
    console.error("Gemini SDK Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate response" });
  }
};