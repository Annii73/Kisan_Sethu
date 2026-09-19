import { GoogleGenAI } from "@google/genai";

export const getPestDetection = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "Server is missing GEMINI_API_KEY",
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
};