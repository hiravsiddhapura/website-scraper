const axios = require('axios');
const cheerio = require('cheerio');
const Product = require('../models/Product');
const {
  cleanText,
  parsePrice,
  parseCurrency,
  parseRating,
  resolveUrl,
  extractDomain,
  sleep
} = require('../utils/scraperUtils');

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

/**
 * Pre-configured website adapter profiles for known sandbox sites
 */
const SITE_PROFILES = {
  'books.toscrape.com': {
    itemSelector: 'article.product_pod',
    titleSelector: 'h3 a',
    priceSelector: '.product_price .price_color',
    availabilitySelector: '.product_price .availability',
    imageSelector: '.image_container img',
    linkSelector: 'h3 a',
    ratingSelector: '.star-rating',
    categorySelector: 'ul.breadcrumb li:nth-child(3) a',
    nextSelector: 'li.next a',
    defaultCategory: 'Books'
  },
  'quotes.toscrape.com': {
    itemSelector: '.quote',
    titleSelector: '.text',
    priceSelector: null,
    availabilitySelector: null,
    imageSelector: null,
    linkSelector: 'span a',
    ratingSelector: null,
    categorySelector: '.author',
    nextSelector: 'li.next a',
    defaultCategory: 'Quotes'
  },
  'webscraper.io': {
    itemSelector: '.thumbnail, .product-wrapper',
    titleSelector: 'a.title, .caption h4 a',
    priceSelector: '.price, .caption h4.price',
    availabilitySelector: null,
    imageSelector: 'img.img-responsive, .image',
    linkSelector: 'a.title, .caption h4 a',
    ratingSelector: '.ratings p[data-rating], .ratings',
    categorySelector: '.sidebar .nav-sidebar .active a',
    nextSelector: '.pagination li.next a, a[rel="next"]',
    defaultCategory: 'Electronics'
  }
};

/**
 * Fetch HTML content from target URL using Axios
 */
const fetchPageHtml = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: DEFAULT_HEADERS,
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Failed to fetch ${url} - Status: ${error.response.status}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timed out while connecting to ${url}`);
    } else {
      throw new Error(`Network error connecting to ${url}: ${error.message}`);
    }
  }
};

/**
 * Extract structured products using JSON-LD metadata if present on modern e-commerce sites
 */
const extractFromJsonLd = ($, currentUrl) => {
  const products = [];
  const domain = extractDomain(currentUrl);

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];

      for (const item of items) {
        if (item['@type'] === 'Product') {
          const title = item.name || item.title;
          const productUrl = resolveUrl(item.url || '', currentUrl);
          const rawPrice = item.offers?.price || item.offers?.lowPrice || 0;
          const currency = item.offers?.priceCurrency || '$';
          const imageUrl = resolveUrl(
            Array.isArray(item.image) ? item.image[0] : item.image?.url || item.image || '',
            currentUrl
          );

          if (title && productUrl) {
            products.push({
              title: cleanText(title),
              price: Number(rawPrice) || 0,
              currency,
              availability: item.offers?.availability?.includes('InStock') ? 'In stock' : 'Available',
              inStock: !item.offers?.availability?.includes('OutOfStock'),
              imageUrl: imageUrl || 'https://placehold.co/300x400?text=No+Image',
              productUrl,
              rating: item.aggregateRating?.ratingValue ? Math.round(item.aggregateRating.ratingValue) : 0,
              category: item.category || 'General',
              sourceDomain: domain,
              scrapedAt: new Date()
            });
          }
        }
      }
    } catch {
      // Ignore unparsable JSON-LD blocks
    }
  });

  return products;
};

/**
 * Generic and adaptive product parser
 * Supports:
 * 1. Custom user selectors (if provided)
 * 2. Pre-configured site adapter profiles
 * 3. JSON-LD structured data
 * 4. Smart heuristic element detection
 */
const parseProducts = (html, currentUrl, customSelectors = {}) => {
  const $ = cheerio.load(html);
  const domain = extractDomain(currentUrl);
  const products = [];

  // Strategy 1: Check JSON-LD metadata
  const jsonLdProducts = extractFromJsonLd($, currentUrl);
  if (jsonLdProducts.length > 0) {
    const nextHref = $('a[rel="next"], .pagination .next a, li.next a').attr('href');
    return {
      products: jsonLdProducts,
      nextPageUrl: nextHref ? resolveUrl(nextHref, currentUrl) : null
    };
  }

  // Strategy 2: Determine CSS selectors to use (Custom -> Profile -> Generic Heuristic)
  const profile = SITE_PROFILES[domain] || {};

  const selectors = {
    item:
      customSelectors.itemSelector ||
      profile.itemSelector ||
      '[class*="product-card"], [class*="product-item"], [class*="product_pod"], .product, .item-card, article',
    title:
      customSelectors.titleSelector ||
      profile.titleSelector ||
      'h2 a, h3 a, h4 a, [class*="title"] a, [class*="title"], h2, h3, h4',
    price:
      customSelectors.priceSelector ||
      profile.priceSelector ||
      '[class*="price"], .amount, [data-price]',
    availability:
      customSelectors.availabilitySelector ||
      profile.availabilitySelector ||
      '[class*="stock"], [class*="availability"]',
    image:
      customSelectors.imageSelector ||
      profile.imageSelector ||
      'img[src]',
    link:
      customSelectors.linkSelector ||
      profile.linkSelector ||
      'a[href]',
    rating:
      customSelectors.ratingSelector ||
      profile.ratingSelector ||
      '[class*="rating"], [class*="star"]',
    category:
      customSelectors.categorySelector ||
      profile.categorySelector ||
      'ul.breadcrumb li:nth-child(3) a, [class*="breadcrumb"] a:last-child',
    next:
      customSelectors.nextSelector ||
      profile.nextSelector ||
      'li.next a, a[rel="next"], .pagination .next a, a:contains("Next")'
  };

  // Extract Category
  const detectedCategory = cleanText($(selectors.category).text()) || profile.defaultCategory || 'General';

  // Strategy 3: Iterate over discovered item elements
  $(selectors.item).each((_, element) => {
    // 1. Title
    const titleEl = $(element).find(selectors.title).first();
    const title =
      titleEl.attr('title') ||
      cleanText(titleEl.text()) ||
      cleanText($(element).find('h2, h3, h4').first().text());

    // 2. Product URL
    let relativeUrl =
      $(element).find(selectors.link).first().attr('href') ||
      titleEl.attr('href') ||
      $(element).find('a').first().attr('href');

    const productUrl = resolveUrl(relativeUrl, currentUrl);

    // 3. Image URL
    const imageEl = $(element).find(selectors.image).first();
    const relativeImage =
      imageEl.attr('src') ||
      imageEl.attr('data-src') ||
      imageEl.attr('srcset')?.split(' ')[0];
    const imageUrl = resolveUrl(relativeImage, currentUrl) || 'https://placehold.co/300x400?text=No+Image';

    // 4. Price & Currency
    const rawPriceText = cleanText($(element).find(selectors.price).first().text());
    const price = parsePrice(rawPriceText);
    const currency = parseCurrency(rawPriceText);

    // 5. Availability & Stock
    const rawAvailability = cleanText($(element).find(selectors.availability).first().text());
    const availability = rawAvailability || 'Available';
    const inStock = !availability.toLowerCase().includes('out of stock');

    // 6. Rating
    const starAttr =
      $(element).find(selectors.rating).first().attr('class') ||
      $(element).find(selectors.rating).first().attr('data-rating') ||
      $(element).find(selectors.rating).first().text();
    const rating = parseRating(starAttr);

    // Only add if we have at least a title and a valid URL
    if (title && productUrl && productUrl !== currentUrl) {
      products.push({
        title,
        price,
        currency,
        availability,
        inStock,
        imageUrl,
        productUrl,
        rating,
        category: detectedCategory,
        sourceDomain: domain,
        scrapedAt: new Date()
      });
    }
  });

  // Strategy 4: Detect Next Page URL for pagination
  const nextRelativeHref = $(selectors.next).first().attr('href');
  const nextPageUrl = nextRelativeHref ? resolveUrl(nextRelativeHref, currentUrl) : null;

  return {
    products,
    nextPageUrl
  };
};

/**
 * Save or update products in MongoDB using bulkWrite (Upsert)
 */
const saveProductsToDatabase = async (products) => {
  if (!products || products.length === 0) {
    return { upsertedCount: 0, modifiedCount: 0, matchedCount: 0 };
  }

  const bulkOperations = products.map((product) => ({
    updateOne: {
      filter: { productUrl: product.productUrl },
      update: { $set: product },
      upsert: true
    }
  }));

  const bulkResult = await Product.bulkWrite(bulkOperations);

  return {
    upsertedCount: bulkResult.upsertedCount || 0,
    modifiedCount: bulkResult.modifiedCount || 0,
    matchedCount: bulkResult.matchedCount || 0
  };
};

/**
 * Dynamic Scraping Engine across any website
 */
const scrapeAndSaveToDatabase = async ({
  startUrl = process.env.SCRAPER_BASE_URL || 'https://books.toscrape.com/',
  pageLimit = 1,
  delayMs = 1000,
  selectors = {}
} = {}) => {
  const startTime = Date.now();
  let currentUrl = startUrl;
  let pageCount = 0;
  let totalProductsFound = 0;
  let totalNewInserted = 0;
  let totalUpdated = 0;
  const domain = extractDomain(startUrl);

  console.log(`\n======================================================`);
  console.log(`🕷️  DYNAMIC SCRAPER STARTED`);
  console.log(`🌐 Target Website: ${domain}`);
  console.log(`🎯 Start URL: ${startUrl}`);
  console.log(`📄 Page Limit: ${pageLimit === 0 ? 'All Pages' : pageLimit}`);
  console.log(`⏱️  Politeness Delay: ${delayMs}ms`);
  console.log(`======================================================\n`);

  while (currentUrl) {
    pageCount += 1;
    console.log(`[Page ${pageCount}] Fetching: ${currentUrl}`);

    const html = await fetchPageHtml(currentUrl);
    const { products, nextPageUrl } = parseProducts(html, currentUrl, selectors);
    totalProductsFound += products.length;

    console.log(`[Page ${pageCount}] Extracted ${products.length} products from ${domain}.`);

    const saveResult = await saveProductsToDatabase(products);
    totalNewInserted += saveResult.upsertedCount;
    totalUpdated += saveResult.modifiedCount;

    if (pageLimit > 0 && pageCount >= pageLimit) {
      console.log(`⏹️ Reached maximum configured page limit of ${pageLimit}.`);
      break;
    }

    if (!nextPageUrl) {
      console.log(`🏁 No further pages found. Scraping completed.`);
      break;
    }

    currentUrl = nextPageUrl;
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  return {
    success: true,
    website: domain,
    pagesScraped: pageCount,
    totalProductsFound,
    newInserted: totalNewInserted,
    updatedExisting: totalUpdated,
    durationSeconds: `${durationSeconds}s`
  };
};

module.exports = {
  SITE_PROFILES,
  fetchPageHtml,
  parseProducts,
  saveProductsToDatabase,
  scrapeAndSaveToDatabase
};
