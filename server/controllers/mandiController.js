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
  
  let mandiPricesCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 2 * 60 * 60 * 1000
  };
  
  export const getLiveMandiPrices = async (req, res) => {
    try {
      const now = Date.now();
  
      if (mandiPricesCache.data && mandiPricesCache.timestamp &&
          (now - mandiPricesCache.timestamp) < mandiPricesCache.CACHE_DURATION) {
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
  };