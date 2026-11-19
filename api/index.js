const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const connectDB = require('../config/db');
const scraperRoutes = require('../routes/scraperRoutes');
const { notFound, errorHandler } = require('../middlewares/errorMiddleware');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS is restricted
}

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Website Scraper Serverless API is live on Vercel!',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// Mount Scraper REST APIs
app.use('/api/scraper', scraperRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
