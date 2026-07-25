# Mandi Prices Scraper

This scraper fetches live mandi (market) prices from Agmarknet and provides them via a REST API.

## Files

- `mandiScraper.js` - Main scraper that fetches prices from Agmarknet
- `cronScheduler.js` - Optional cron-based automatic refresh scheduler

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

Required packages:
- `axios` - HTTP client for making requests
- `cheerio` - HTML parsing (jQuery-like server-side)
- `node-cron` - Cron job scheduler (optional)

2. The scraper is automatically used by the `/api/live-mandi-prices` endpoint in `server.js`

## Usage

### Automatic (via API)
The scraper runs automatically when you call:
```
GET /api/live-mandi-prices
```

### Manual
```javascript
import getMandiPrices from './server/scrapers/mandiScraper.js';

const prices = await getMandiPrices();
console.log(prices);
```

### With Cron Scheduler
To enable automatic refresh every 2 hours, uncomment the cron scheduler code in `server.js`:

```javascript
import('./server/scrapers/cronScheduler.js').then(({ startCronScheduler }) => {
  startCronScheduler('0 */2 * * *'); // Every 2 hours
});
```

## Data Structure

Each price record contains:
- `state` - State name
- `district` - District name
- `market` - Market name
- `commodity` - Commodity name (e.g., "Rice", "Tomato")
- `variety` - Variety of the commodity
- `minPrice` - Minimum price (₹)
- `maxPrice` - Maximum price (₹)
- `modalPrice` - Modal/average price (₹)
- `date` - Date of the price
- `scrapedAt` - Timestamp when data was scraped

## Fallback Behavior

The scraper has multiple fallback mechanisms:
1. Tries to fetch from Agmarknet API (if available)
2. Falls back to web scraping
3. Returns sample data if both methods fail

This ensures the API always returns data, even if Agmarknet is temporarily unavailable.

## Caching

The API endpoint caches results for 2 hours to reduce load on Agmarknet servers. If scraping fails, it returns stale cached data if available.

## Notes

- The scraper includes delays between requests to be respectful to Agmarknet servers
- Sample data is used as a last resort to ensure the frontend always has data to display
- All prices are in Indian Rupees (₹)

