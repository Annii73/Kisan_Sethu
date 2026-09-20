import { Redis } from "@upstash/redis";

const CACHE_KEY = "mandi_prices";
const CACHE_TTL = 2 * 60 * 60;

function getRedisClient() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function getMandiPricesFromDataGov() {
  const apiKey = process.env.DATA_GOV_API_KEY;
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

export const getLiveMandiPrices = async (req, res) => {
  const redis = getRedisClient();
  
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    const prices = await getMandiPricesFromDataGov();

    if (!prices || prices.length === 0) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch mandi prices. Please try again later."
      });
    }

    await redis.set(CACHE_KEY, prices, { ex: CACHE_TTL });

    res.json({
      success: true,
      data: prices,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in /api/live-mandi-prices:", error);
    res.status(500).json({
      success: false,
      error: "Live data unavailable — please try again later.",
      details: error.message
    });
  }
};