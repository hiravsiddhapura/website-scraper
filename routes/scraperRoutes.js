const express = require('express');
const router = express.Router();
const {
  startScraper,
  getProducts,
  getProductById,
  deleteProduct,
  deleteAllProducts,
  getScraperStats,
  getScraperStatus
} = require('../controllers/scraperController');

// Scraper control endpoints
router.post('/start', startScraper);
router.get('/status', getScraperStatus);
router.get('/stats', getScraperStats);

// Product CRUD and query endpoints
router.get('/products', getProducts);
router.delete('/products', deleteAllProducts);
router.get('/products/:id', getProductById);
router.delete('/products/:id', deleteProduct);

module.exports = router;
