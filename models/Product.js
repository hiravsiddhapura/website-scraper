const mongoose = require('mongoose');

/**
 * Dynamic Product Schema
 * Defines the structure for scraped products across multiple websites in MongoDB
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
      default: '£',
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
      default: 'https://placehold.co/300x400?text=No+Image',
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
    sourceDomain: {
      type: String,
      default: 'books.toscrape.com',
      index: true,
      trim: true
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

// Create compound index for faster website-based and category-based queries
productSchema.index({ sourceDomain: 1, category: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
