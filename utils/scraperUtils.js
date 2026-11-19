/**
 * Scraper Utility Functions
 * Sanitizes and normalizes raw scraped data from any website
 */

// Map word-based star rating classes to numbers
const RATING_MAP = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5
};

/**
 * Clean text by trimming extra whitespaces, newlines, and tabs
 * @param {string} text
 * @returns {string}
 */
const cleanText = (text) => {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
};

/**
 * Extract clean numeric price from string (e.g. "£51.77", "$19.99", "€ 45.00" -> 51.77)
 * @param {string} priceString
 * @returns {number}
 */
const parsePrice = (priceString) => {
  if (!priceString) return 0;
  const match = priceString.replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
};

/**
 * Detect currency symbol from text ($, £, €, ₹, ¥, etc.)
 * @param {string} text
 * @returns {string}
 */
const parseCurrency = (text) => {
  if (!text) return '£';
  if (text.includes('$')) return '$';
  if (text.includes('€')) return '€';
  if (text.includes('£')) return '£';
  if (text.includes('₹')) return '₹';
  if (text.includes('¥')) return '¥';
  return '£';
};

/**
 * Convert rating text (e.g. "Three", "4.5 out of 5", "star-rating Four") into a number (0-5)
 * @param {string} ratingString
 * @returns {number}
 */
const parseRating = (ratingString) => {
  if (!ratingString) return 0;

  // Check if string contains numbers (e.g. "4.5 out of 5")
  const numMatch = ratingString.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val <= 5) return Math.round(val);
  }

  // Check word-based ratings
  const words = ratingString.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (RATING_MAP[word] !== undefined) {
      return RATING_MAP[word];
    }
  }
  return 0;
};

/**
 * Resolve relative URL to absolute URL
 * @param {string} relativeUrl
 * @param {string} baseUrl
 * @returns {string}
 */
const resolveUrl = (relativeUrl, baseUrl) => {
  if (!relativeUrl) return '';
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (error) {
    return relativeUrl;
  }
};

/**
 * Extract clean domain name from URL (e.g. "books.toscrape.com")
 * @param {string} url
 * @returns {string}
 */
const extractDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
};

/**
 * Pause execution for given milliseconds (politeness delay)
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  cleanText,
  parsePrice,
  parseCurrency,
  parseRating,
  resolveUrl,
  extractDomain,
  sleep
};
