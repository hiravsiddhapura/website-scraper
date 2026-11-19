const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const scraperRoutes = require('./routes/scraperRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { initCronJob } = require('./services/cronService');

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize automated cron scraping jobs
initCronJob();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Built-in Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Website Scraper API server is up and running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Mount Scraper REST APIs
app.use('/api/scraper', scraperRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server if not run in serverless environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🕷️  Scraper API: http://localhost:${PORT}/api/scraper/products`);
    console.log(`=================================`);
  });
}

module.exports = app;
