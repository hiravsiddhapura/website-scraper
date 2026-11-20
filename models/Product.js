const mongoose = require('mongoose');

/**
 * Universal Dynamic Product Schema
 * Stores structured product data extracted from any arbitrary e-commerce website
 */
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: '$',
      trim: true
    },
    availability: {
      type: String,
      default: 'Available',
      trim: true
    },
    inStock: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String,
      default: 'https://placehold.co/400x500?text=No+Product+Image',
      trim: true
    },
    productUrl: {
      type: String,
      required: [true, 'Product page URL is required'],
      unique: true, // Prevents duplicate product entries in MongoDB
      index: true,
      trim: true
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    brand: {
      type: String,
      default: 'Generic',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    sku: {
      type: String,
      default: '',
      trim: true
    },
    sourceDomain: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    pageType: {
      type: String,
      enum: ['detail', 'listing'],
      default: 'detail'
    },
    extractionSource: {
      type: String,
      enum: ['json-ld', 'opengraph', 'microdata', 'hydration', 'heuristic', 'profile'],
      default: 'heuristic'
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    scrapedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast multi-filter querying
productSchema.index({ sourceDomain: 1, category: 1 });
productSchema.index({ sourceDomain: 1, brand: 1 });
productSchema.index({ pageType: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
