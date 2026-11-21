const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const scraperRoutes = require('../routes/scraperRoutes');
const { notFound, errorHandler } = require('../middlewares/errorMiddleware');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless DB Connection Middleware: Ensures MongoDB connection is ready before processing routes
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Serverless DB Middleware Error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

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
