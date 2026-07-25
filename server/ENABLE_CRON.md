# How to Enable Cron Scheduler

To enable automatic refresh of mandi prices, edit `server.js` and replace the commented cron section with:

```javascript
try {
  const { startCronScheduler } = await import('./server/scrapers/cronScheduler.js');
  // Every 2 hours
  const cronSchedule = '0 0,2,4,6,8,10,12,14,16,18,20,22 * * *';
  startCronScheduler(cronSchedule);
} catch (err) {
  console.log('⚠️  Cron scheduler not available:', err.message);
}
```

## Alternative Cron Schedules

Instead of `'0 0,2,4,6,8,10,12,14,16,18,20,22 * * *'`, you can use:

- **Every 6 hours:** `'0 0,6,12,18 * * *'`
- **Daily at 6 AM:** `'0 6 * * *'`
- **Every 30 minutes:** `'0,30 * * * *'`
- **Every hour:** `'0 * * * *'`

Note: We avoid using `*/2` format inside comments because `*/` closes comment blocks.

