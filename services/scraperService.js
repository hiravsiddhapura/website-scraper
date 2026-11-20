const axios = require('axios');
const cheerio = require('cheerio');
const Product = require('../models/Product');
const { extractFromJsonLd } = require('./extractors/jsonLdExtractor');
const { extractFromMetaTags } = require('./extractors/metaTagsExtractor');
const { extractFromHydration } = require('./extractors/hydrationExtractor');
const {
  extractSingleProductHeuristic,
  extractCatalogHeuristic
} = require('./extractors/heuristicExtractor');
const {
  cleanText,
  parsePrice,
  parseCurrency,
  parseRating,
  resolveUrl,
  extractDomain,
  sleep
} = require('../utils/scraperUtils');

// Clean browser headers that avoid triggering anti-bot fingerprint mismatches
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

/**
 * Fetch HTML content from target URL using Axios with clear anti-bot error handling
 */
const fetchPageHtml = async (url) => {
  const cleanUrl = (url || '').trim();
  try {
    const response = await axios.get(cleanUrl, {
      headers: DEFAULT_HEADERS,
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        throw new Error(
          `Access blocked by target website (HTTP 403 Forbidden). This website uses Cloudflare or Bot Protection preventing direct automated access.`
        );
      } else if (status === 429) {
        throw new Error(
          `Rate limit exceeded by target website (HTTP 429 Too Many Requests). The website server is temporarily throttling requests.`
        );
      }
      throw new Error(`Failed to fetch ${cleanUrl} - Status: ${status}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timed out while connecting to ${cleanUrl}`);
    } else {
      throw new Error(`Network error connecting to ${cleanUrl}: ${error.message}`);
    }
  }
};

/**
 * Automatically detects whether a page is a Single Product Detail Page (PDP)
 * or a Multi-Product Catalog / Collection Page (PLP)
 */
const detectPageType = ($, url) => {
  const lowercaseUrl = url.toLowerCase();

  // If there are multiple product cards (>= 3), it's definitely a listing/catalog page
  const multiCardCount = $(
    'article.product_pod, [class*="product-card"], [class*="product-item"], .thumbnail'
  ).length;
  if (multiCardCount >= 3) {
    return 'listing';
  }

  // If single product container exists
  if (
    $(
      'article.product_page, .product-main, .product_main, .product-single, #product-details, [itemtype*="Product"]'
    ).length > 0
  ) {
    return 'detail';
  }

  // URL hints for single product
  if (
    /\/\w+[\-_]\d+\/index\.html/.test(lowercaseUrl) ||
    lowercaseUrl.includes('/product/') ||
    lowercaseUrl.includes('/products/') ||
    lowercaseUrl.includes('/item/') ||
    lowercaseUrl.includes('/dp/') ||
    lowercaseUrl.includes('/p/') ||
    lowercaseUrl.includes('/buy/')
  ) {
    return 'detail';
  }

  // URL hints for catalog
  if (
    lowercaseUrl.includes('/collection') ||
    lowercaseUrl.includes('/category') ||
    lowercaseUrl.includes('/search') ||
    lowercaseUrl.includes('/shop') ||
    lowercaseUrl.includes('/page-')
  ) {
    return 'listing';
  }

  // Check for prominent H1 and Add to Cart button
  const hasCartBtn =
    $('button, a, input[type="submit"]').filter((_, el) => {
      const text = ($(el).text() || $(el).val() || '').toLowerCase();
      return (
        text.includes('add to basket') ||
        text.includes('add to cart') ||
        text.includes('add to bag') ||
        text.includes('buy now')
      );
    }).length > 0;

  if (hasCartBtn && $('h1').length === 1) {
    return 'detail';
  }

  return multiCardCount > 0 ? 'listing' : 'detail';
};

/**
 * Universal Cascading Extraction Engine
 * Evaluates Schema.org JSON-LD -> Hydration State -> OpenGraph Meta -> Visual Heuristics
 *
 * @param {string} html - Webpage HTML
 * @param {string} currentUrl - Page URL
 * @param {Object} options - Custom selectors and mode options
 * @returns {{ products: Array<Object>, nextPageUrl: string | null, pageType: string, suggestedLinks: Array<string> }}
 */
const parseProductsUniversal = (html, currentUrl, options = {}) => {
  const $ = cheerio.load(html);
  const detectedType = detectPageType($, currentUrl);
  const mode = options.mode || 'auto'; // 'auto' | 'single' | 'catalog'
  const targetPageType = mode === 'auto' ? detectedType : mode === 'single' ? 'detail' : 'listing';

  let extractedProducts = [];

  // Strategy 1: Schema.org JSON-LD (Highest accuracy: ~98%)
  const jsonLdItems = extractFromJsonLd($, currentUrl);
  if (jsonLdItems.length > 0) {
    if (targetPageType === 'detail') {
      const singleProduct = jsonLdItems.find((p) => p.pageType === 'detail') || jsonLdItems[0];
      extractedProducts = [singleProduct];
    } else {
      extractedProducts = jsonLdItems;
    }
  }

  // Strategy 2: Framework Hydration Objects (Next.js __NEXT_DATA__, Shopify)
  if (extractedProducts.length === 0) {
    const hydrationItems = extractFromHydration($, currentUrl);
    if (hydrationItems.length > 0) {
      extractedProducts = hydrationItems;
    }
  }

  // Strategy 3: OpenGraph & HTML5 Microdata (For Single Product Detail Pages)
  if (extractedProducts.length === 0 && targetPageType === 'detail') {
    const metaProduct = extractFromMetaTags($, currentUrl);
    if (metaProduct) {
      extractedProducts = [metaProduct];
    }
  }

  // Strategy 4: Visual Heuristic DOM Scoring (Fallback for zero metadata)
  if (extractedProducts.length === 0) {
    if (targetPageType === 'detail') {
      const singleHeuristic = extractSingleProductHeuristic($, currentUrl);
      if (singleHeuristic) {
        extractedProducts = [singleHeuristic];
      }
    } else {
      extractedProducts = extractCatalogHeuristic($, currentUrl);
    }
  }

  // Strategy 5: Custom User Selectors Override (If explicitly provided)
  if (options.selectors && Object.keys(options.selectors).length > 0) {
    const sel = options.selectors;
    if (sel.itemSelector) {
      const customItems = [];
      $(sel.itemSelector).each((_, el) => {
        const titleEl = sel.titleSelector
          ? $(el).find(sel.titleSelector).first()
          : $(el).find('h2, h3, h4').first();
        const title = cleanText(titleEl.attr('title') || titleEl.text());
        const linkEl = sel.linkSelector
          ? $(el).find(sel.linkSelector).first()
          : $(el).find('a').first();
        const productUrl = resolveUrl(linkEl.attr('href'), currentUrl);
        const priceText = sel.priceSelector
          ? cleanText($(el).find(sel.priceSelector).first().text())
          : '';
        const price = parsePrice(priceText);
        const currency = parseCurrency(priceText);
        const imgEl = sel.imageSelector
          ? $(el).find(sel.imageSelector).first()
          : $(el).find('img').first();
        const imageUrl = resolveUrl(imgEl.attr('src') || imgEl.attr('data-src'), currentUrl);

        if (title && productUrl) {
          customItems.push({
            title,
            price,
            currency,
            availability: 'Available',
            inStock: true,
            imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
            productUrl,
            rating: 0,
            category: 'Custom',
            brand: 'Generic',
            description: '',
            sku: '',
            sourceDomain: extractDomain(currentUrl),
            pageType: 'listing',
            extractionSource: 'profile',
            confidenceScore: 90,
            scrapedAt: new Date()
          });
        }
      });

      if (customItems.length > 0) {
        extractedProducts = customItems;
      }
    }
  }

  // If 0 products found (e.g. user entered a brand Homepage), auto-discover product & collection links
  const suggestedLinks = [];
  if (extractedProducts.length === 0) {
    const seenHrefs = new Set();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const lower = href.toLowerCase();
      if (
        lower.includes('/collections/') ||
        lower.includes('/category/') ||
        lower.includes('/shop/') ||
        lower.includes('/products/') ||
        lower.includes('/item/')
      ) {
        const fullUrl = resolveUrl(href, currentUrl);
        if (fullUrl && fullUrl !== currentUrl && !seenHrefs.has(fullUrl)) {
          seenHrefs.add(fullUrl);
          suggestedLinks.push(fullUrl);
        }
      }
    });
  }

  // Detect Next Page URL for multi-page catalog navigation
  const nextSelectors = [
    'li.next a',
    'a[rel="next"]',
    '.pagination .next a',
    '[class*="pagination"] [class*="next"] a',
    'a:contains("Next")',
    'a:contains("Next »")'
  ];

  let nextPageUrl = null;
  for (const selector of nextSelectors) {
    const nextHref = $(selector).first().attr('href');
    if (nextHref) {
      nextPageUrl = resolveUrl(nextHref, currentUrl);
      break;
    }
  }

  return {
    products: extractedProducts,
    nextPageUrl,
    pageType: targetPageType,
    suggestedLinks: suggestedLinks.slice(0, 5)
  };
};

/**
 * Save or update products in MongoDB using bulkWrite (Upsert)
 * Prevents duplicates by matching on productUrl while updating latest fields
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
 * Universal Scraper Controller:
 * Handles single product links OR catalog pagination across any e-commerce site
 */
const scrapeAndSaveToDatabase = async ({
  startUrl = process.env.SCRAPER_BASE_URL || 'https://books.toscrape.com/',
  pageLimit = 1,
  delayMs = 1000,
  mode = 'auto',
  selectors = {}
} = {}) => {
  const startTime = Date.now();
  let currentUrl = startUrl;
  let pageCount = 0;
  let totalProductsFound = 0;
  let totalNewInserted = 0;
  let totalUpdated = 0;
  const domain = extractDomain(startUrl);
  let dominantMethod = 'heuristic';
  let dominantPageType = 'detail';
  let discoveredSuggestions = [];

  console.log(`\n======================================================`);
  console.log(`🌐 UNIVERSAL SCRAPER LAUNCHED`);
  console.log(`🎯 URL: ${startUrl}`);
  console.log(`🏷️ Domain: ${domain}`);
  console.log(`⚙️ Mode: ${mode}`);
  console.log(`📄 Page Limit: ${pageLimit === 0 ? 'All Pages' : pageLimit}`);
  console.log(`======================================================\n`);

  while (currentUrl) {
    pageCount += 1;
    console.log(`[Page ${pageCount}] Fetching: ${currentUrl}`);

    let html;
    try {
      html = await fetchPageHtml(currentUrl);
    } catch (fetchErr) {
      let rootOriginUrl;
      try {
        const parsed = new URL(currentUrl);
        rootOriginUrl = `${parsed.origin}/`;
      } catch {
        // Invalid URL format
      }

      // If a subpath collection/category URL is blocked with 429/403, try the store root storefront
      if (
        rootOriginUrl &&
        currentUrl !== rootOriginUrl &&
        (fetchErr.message.includes('429') || fetchErr.message.includes('403'))
      ) {
        console.warn(
          `⚠️ Sub-path ${currentUrl} was rate-limited or blocked. Attempting fallback to root storefront: ${rootOriginUrl}`
        );
        try {
          html = await fetchPageHtml(rootOriginUrl);
          currentUrl = rootOriginUrl;
        } catch {
          throw fetchErr; // re-throw original if root also fails
        }
      } else {
        throw fetchErr;
      }
    }
    const { products, nextPageUrl, pageType, suggestedLinks } = parseProductsUniversal(html, currentUrl, {
      mode,
      selectors
    });

    dominantPageType = pageType;
    if (suggestedLinks && suggestedLinks.length > 0) {
      discoveredSuggestions = suggestedLinks;
    }

    if (products.length > 0 && products[0].extractionSource) {
      dominantMethod = products[0].extractionSource;
    }

    totalProductsFound += products.length;
    console.log(
      `[Page ${pageCount}] Extracted ${products.length} product(s) via [${dominantMethod}] (Detected: ${pageType}).`
    );

    const saveResult = await saveProductsToDatabase(products);
    totalNewInserted += saveResult.upsertedCount;
    totalUpdated += saveResult.modifiedCount;

    // Single product pages do not paginate
    if (pageType === 'detail') {
      console.log(`✅ Single product page processed.`);
      break;
    }

    if (pageLimit > 0 && pageCount >= pageLimit) {
      console.log(`⏹️ Reached maximum configured page limit of ${pageLimit}.`);
      break;
    }

    if (!nextPageUrl) {
      console.log(`🏁 No further pagination links found. Crawl completed.`);
      break;
    }

    currentUrl = nextPageUrl;
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  const summary = {
    success: true,
    website: domain,
    pageType: dominantPageType,
    extractionMethod: dominantMethod,
    pagesScraped: pageCount,
    totalProductsFound,
    newInserted: totalNewInserted,
    updatedExisting: totalUpdated,
    suggestedLinks: discoveredSuggestions,
    durationSeconds: `${durationSeconds}s`
  };

  console.log(`\n======================================================`);
  console.log(`✅ UNIVERSAL SCRAPING COMPLETE`);
  console.log(`📊 Summary:`, JSON.stringify(summary, null, 2));
  console.log(`======================================================\n`);

  return summary;
};

module.exports = {
  fetchPageHtml,
  detectPageType,
  parseProductsUniversal,
  saveProductsToDatabase,
  scrapeAndSaveToDatabase
};
