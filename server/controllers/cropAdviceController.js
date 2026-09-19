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