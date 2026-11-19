const Joi = require('joi');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { scrapeAndSaveToDatabase, SITE_PROFILES } = require('../services/scraperService');

// State tracker to monitor active scraping jobs
const scraperState = {
  isRunning: false,
  startTime: null,
  lastRunTime: null,
  lastRunSummary: null,
  currentTask: null
};

// Joi schema supporting dynamic target URLs and optional custom selectors
const startScraperSchema = Joi.object({
  url: Joi.string()
    .uri()
    .default(process.env.SCRAPER_BASE_URL || 'https://books.toscrape.com/'),
  pageLimit: Joi.number().integer().min(0).max(50).default(1),
  delayMs: Joi.number().integer().min(0).max(10000).default(1000),
  selectors: Joi.object({
    itemSelector: Joi.string().allow('', null),
    titleSelector: Joi.string().allow('', null),
    priceSelector: Joi.string().allow('', null),
    availabilitySelector: Joi.string().allow('', null),
    imageSelector: Joi.string().allow('', null),
    linkSelector: Joi.string().allow('', null),
    ratingSelector: Joi.string().allow('', null),
    categorySelector: Joi.string().allow('', null),
    nextSelector: Joi.string().allow('', null)
  }).default({})
});

/**
 * @desc    Trigger dynamic scraping job and save data to MongoDB
 * @route   POST /api/scraper/start
 */
const startScraper = async (req, res, next) => {
  try {
    const { error, value } = startScraperSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        details: error.details.map((d) => d.message)
      });
    }

    if (scraperState.isRunning) {
      return res.status(409).json({
        success: false,
        message: 'A scraping job is already in progress. Please wait for it to complete.',
        status: scraperState
      });
    }

    const { url, pageLimit, delayMs, selectors } = value;

    scraperState.isRunning = true;
    scraperState.startTime = new Date();
    scraperState.currentTask = { url, pageLimit, delayMs };

    try {
      const summary = await scrapeAndSaveToDatabase({
        startUrl: url,
        pageLimit,
        delayMs,
        selectors
      });

      scraperState.isRunning = false;
      scraperState.lastRunTime = new Date();
      scraperState.lastRunSummary = summary;
      scraperState.currentTask = null;

      return res.status(200).json({
        success: true,
        message: `Scraping completed for ${summary.website} and saved to MongoDB.`,
        data: summary
      });
    } catch (scrapeErr) {
      scraperState.isRunning = false;
      scraperState.currentTask = null;
      throw scrapeErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all scraped products with multi-website filters, search & pagination
 * @route   GET /api/scraper/products
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sourceDomain,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    // 1. Text Search on Title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // 2. Filter by Website Domain
    if (sourceDomain) {
      query.sourceDomain = { $regex: sourceDomain, $options: 'i' };
    }

    // 3. Filter by Category
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // 4. Filter by Price Range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // 5. Filter by Rating
    if (rating !== undefined) {
      query.rating = Number(rating);
    }

    // 6. Filter by inStock
    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const [products, total, domains] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
      Product.distinct('sourceDomain')
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      availableWebsites: domains,
      products
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single product by MongoDB ID
 * @route   GET /api/scraper/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID format: ${id}`
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${id}`
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a product by MongoDB ID
 * @route   DELETE /api/scraper/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid product ID format: ${id}`
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id: ${id}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      deletedId: id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get aggregate stats of scraped products in MongoDB across all websites
 * @route   GET /api/scraper/stats
 */
const getScraperStats = async (req, res, next) => {
  try {
    const [totalProducts, availableProducts, outOfStockProducts, websiteBreakdown, priceStats] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ inStock: true }),
        Product.countDocuments({ inStock: false }),
        Product.aggregate([
          { $group: { _id: '$sourceDomain', count: { $sum: 1 } } }
        ]),
        Product.aggregate([
          {
            $group: {
              _id: null,
              avgPrice: { $avg: '$price' },
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' }
            }
          }
        ])
      ]);

    const priceAggregate = priceStats[0] || {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0
    };

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        availableProducts,
        outOfStockProducts,
        websites: websiteBreakdown.map((w) => ({ domain: w._id || 'unknown', count: w.count })),
        pricing: {
          average: Number(priceAggregate.avgPrice.toFixed(2)),
          minimum: Number(priceAggregate.minPrice.toFixed(2)),
          maximum: Number(priceAggregate.maxPrice.toFixed(2))
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Check current scraper running status
 * @route   GET /api/scraper/status
 */
const getScraperStatus = (req, res) => {
  res.status(200).json({
    success: true,
    status: {
      isRunning: scraperState.isRunning,
      startTime: scraperState.startTime,
      lastRunTime: scraperState.lastRunTime,
      lastRunSummary: scraperState.lastRunSummary,
      currentTask: scraperState.currentTask
    }
  });
};

module.exports = {
  startScraper,
  getProducts,
  getProductById,
  deleteProduct,
  getScraperStats,
  getScraperStatus
};
