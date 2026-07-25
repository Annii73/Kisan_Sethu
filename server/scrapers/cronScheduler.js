import cron from 'node-cron';
import getMandiPrices from './mandiScraper.js';

/**
 * Cron-based automatic refresh scheduler for mandi prices
 * This runs the scraper at scheduled intervals to keep cache fresh
 */

let isRunning = false;

/**
 * Run the scraper (this will update the cache in server.js)
 */
async function refreshMandiPrices() {
  if (isRunning) {
    console.log('⏭️  Scraper already running, skipping...');
    return;
  }

  try {
    isRunning = true;
    console.log('🔄 [Cron] Starting scheduled mandi prices refresh...');
    const prices = await getMandiPrices();
    console.log(`✅ [Cron] Refreshed ${prices.length} mandi price records`);
  } catch (error) {
    console.error('❌ [Cron] Error refreshing mandi prices:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Start cron scheduler
 * Options:
 * - Every 2 hours: '0 */2 * * *'
 * - Every 6 hours: '0 */6 * * *'
 * - Daily at 6 AM: '0 6 * * *'
 * - Every 30 minutes: '*/30 * * * *'
 */
export function startCronScheduler(schedule = '0 */2 * * *') {
  console.log(`⏰ Starting cron scheduler with schedule: ${schedule}`);
  console.log('   This will refresh mandi prices automatically');

  // Run immediately on startup
  refreshMandiPrices();

  // Schedule recurring job
  cron.schedule(schedule, () => {
    refreshMandiPrices();
  });

  console.log('✅ Cron scheduler started successfully');
}

/**
 * Stop cron scheduler (if needed)
 */
export function stopCronScheduler() {
  // Cron jobs are managed globally, this is just for reference
  console.log('⏹️  Cron scheduler stop requested');
}

export default {
  start: startCronScheduler,
  stop: stopCronScheduler,
  refresh: refreshMandiPrices
};

