import { GoogleGenAI } from "@google/genai";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const CACHE_TTL = 2 * 60 * 60; // 2 hours

function getRedisClient() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function getCacheKey(query) {
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const hash = crypto.createHash("md5").update(normalized).digest("hex");
  return `chatbot:${hash}`;
}

// Helper function to pause execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 20 LPA Upgrade: Exponential Backoff Wrapper for Gemini API
async function generateWithRetry(ai, params, attempt = 1) {
  const MAX_RETRIES = 3;
  try {
    return await ai.models.generateContent(params);
  } catch (error) {
    if ((error.status === 503 || error.status === 429) && attempt <= MAX_RETRIES) {
      const waitTime = 1000 * Math.pow(2, attempt - 1); // Waits 1s, then 2s, then 4s
      console.warn(`[Gemini API Issue] Status ${error.status}. Retrying in ${waitTime}ms (Attempt ${attempt})...`);
      
      await delay(waitTime);
      return generateWithRetry(ai, params, attempt + 1);
    }
    throw error; // Rethrow if it's a different error or max retries exceeded
  }
}

async function getMandiPrice(crop, location) {
  try {
    const apiKey = process.env.DATA_GOV_API_KEY;
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=10&filters[commodity]=${encodeURIComponent(crop)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.records || data.records.length === 0) {
      return `No price data found for ${crop}`;
    }
    const prices = data.records.slice(0, 3).map(r =>
      `${r.market} (${r.state}): ₹${r.modal_price}/quintal`
    ).join(", ");
    return `Current ${crop} prices: ${prices}`;
  } catch (err) {
    return `Unable to fetch price data for ${crop}`;
  }
}

async function getWeatherData(location) {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return `Could not find weather data for ${location}`;
    }
    const { latitude, longitude } = geoData.results[0];
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=precipitation_sum&timezone=auto`);
    const wx = await wxRes.json();
    return `Weather in ${location}: ${Math.round(wx.current.temperature_2m)}°C, Wind: ${Math.round(wx.current.wind_speed_10m * 3.6)} km/h, Rain today: ${Math.round(wx.daily.precipitation_sum[0])}mm`;
  } catch (err) {
    return `Unable to fetch weather data for ${location}`;
  }
}

const tools = [{
  functionDeclarations: [
    {
      name: "getMandiPrice",
      description: "Get current market/mandi prices for a specific crop in India",
      parameters: {
        type: "object",
        properties: {
          crop: { type: "string", description: "Name of the crop (e.g., wheat, rice, tomato)" },
          location: { type: "string", description: "Location/state in India" }
        },
        required: ["crop"]
      }
    },
    {
      name: "getWeatherData",
      description: "Get current weather conditions for farming decisions",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City or location in India" }
        },
        required: ["location"]
      }
    }
  ]
}];

export const getChatbotResponse = async (req, res) => {
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

    // Step 1 — Cache check
    const cacheKey = getCacheKey(prompt);
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("✅ Chatbot cache hit");
      return res.json({ success: true, text: cached, cached: true });
    }

    // Step 2 — Initial Gemini call with tools (Wrapped in Retry)
    const initialParams = {
      model: "gemini-flash-latest", // explicitly set to 1.5-flash for better high-demand handling
      contents: prompt,
      config: {
        systemInstruction: `You are Kisaan Sethu AI, an expert Indian agriculture advisor. 
Help farmers with crop advice, pest control, irrigation, weather, and mandi prices.
Use available tools when farmers ask about current prices or weather.
Always respond in the same language as the user (Hindi or English).`,
        tools: tools
      }
    };
    
    const initialResponse = await generateWithRetry(ai, initialParams);
    const candidate = initialResponse.candidates[0];
    const parts = candidate.content.parts;
    const functionCallPart = parts?.find(p => p.functionCall);

    let finalText;

    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;
      console.log(`🔧 Tool called: ${name}`, args);

      let toolResult;
      if (name === "getMandiPrice") {
        toolResult = await getMandiPrice(args.crop, args.location);
      } else if (name === "getWeatherData") {
        toolResult = await getWeatherData(args.location);
      }

      // Step 3 — Final Gemini call after tool execution (Wrapped in Retry)
      const finalParams = {
        model: "gemini-flash-latest",
        contents: [
          { role: "user", parts: [{ text: prompt }] },
          candidate.content,
          {
            role: "user",
            parts: [{
              functionResponse: {
                name: name,
                response: { result: toolResult }
              }
            }]
          }
        ],
        config: {
          systemInstruction: `You are Kisaan Sethu AI, an expert Indian agriculture advisor.
Always respond in the same language as the user (Hindi or English).`,
          tools: tools
        }
      };

      const finalResponse = await generateWithRetry(ai, finalParams);
      finalText = finalResponse.text;
    } else {
      finalText = initialResponse.text;
    }

    // Step 4 — Cache save
    await redis.set(cacheKey, finalText, { ex: CACHE_TTL });

    res.json({ success: true, text: finalText, cached: false });
    
  } catch (error) {
    console.error("Chatbot Error:", error);
    
    // Graceful Fallback for frontend (Avoid breaking the UI if API completely dies)
    if (error.status === 503 || error.status === 429) {
      return res.json({ 
        success: true, 
        text: "Abhi humare network par traffic jyada hai. Kripya apna sawal kuch der baad wapas puche. (System Overloaded)", 
        cached: false 
      });
    }

    res.status(500).json({ success: false, error: error.message || "Failed to generate response" });
  }
};