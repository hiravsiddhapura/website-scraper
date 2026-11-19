const cron = require('node-cron');
const { scrapeAndSaveToDatabase } = require('./scraperService');

/**
 * Initializes scheduled automated scraping jobs using node-cron
 */
const initCronJob = () => {
  const cronExpression = process.env.SCRAPE_SCHEDULE || '0 0 * * *';

  // Validate the cron expression syntax
  if (!cron.validate(cronExpression)) {
    console.error(`❌ Invalid cron expression in .env: "${cronExpression}"`);
    return;
  }

  console.log(`⏰ Cron Scheduler initialized with schedule: "${cronExpression}"`);

  let isJobRunning = false;

  cron.schedule(cronExpression, async () => {
    if (isJobRunning) {
      console.warn('⚠️ [Cron] Previous scheduled scrape job is still running. Skipping this cycle.');
      return;
    }

    isJobRunning = true;
    console.log(`\n⏰ [Cron] Starting scheduled scraping job at ${new Date().toISOString()}...`);

    try {
      await scrapeAndSaveToDatabase({
        startUrl: process.env.SCRAPER_BASE_URL || 'https://books.toscrape.com/',
        pageLimit: 2, // Scrape top 2 pages by default in cron
        delayMs: 1500
      });
      console.log(`⏰ [Cron] Scheduled scraping finished successfully.`);
    } catch (err) {
      console.error(`❌ [Cron] Error during scheduled scrape: ${err.message}`);
    } finally {
      isJobRunning = false;
    }
  });
};

module.exports = { initCronJob };
