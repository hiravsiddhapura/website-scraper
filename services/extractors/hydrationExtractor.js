const {
  cleanText,
  parsePrice,
  parseCurrency,
  resolveUrl,
  extractDomain
} = require('../../utils/scraperUtils');

/**
 * Searches an object recursively for products or collections of products
 */
const findProductsInObject = (obj, products = [], currentUrl, depth = 0) => {
  if (!obj || typeof obj !== 'object' || depth > 8) return products;

  // Check if current object represents a product
  if (
    (obj.title || obj.name) &&
    (obj.price || obj.variants || obj.sku || obj.handle)
  ) {
    const title = cleanText(obj.title || obj.name);
    const rawPrice = obj.price || obj.variants?.[0]?.price || 0;
    const price = parsePrice(String(rawPrice));
    const currency = parseCurrency(String(obj.currency || '$'));
    const relativeUrl = obj.url || (obj.handle ? `/products/${obj.handle}` : '');
    const productUrl = resolveUrl(relativeUrl, currentUrl) || currentUrl;

    const rawImg =
      obj.featured_image ||
      obj.image?.src ||
      obj.images?.[0]?.src ||
      obj.image ||
      '';
    const imageUrl = resolveUrl(rawImg, currentUrl);

    if (title && price > 0) {
      products.push({
        title,
        price,
        currency,
        availability: obj.available === false ? 'Out of stock' : 'In stock',
        inStock: obj.available !== false,
        imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
        productUrl,
        rating: 0,
        category: cleanText(obj.type || obj.category || 'General'),
        brand: cleanText(obj.vendor || obj.brand || 'Generic'),
        description: cleanText(obj.description || '').substring(0, 300),
        sku: String(obj.sku || ''),
        sourceDomain: extractDomain(currentUrl),
        pageType: 'detail',
        extractionSource: 'hydration',
        confidenceScore: 92,
        scrapedAt: new Date()
      });
      return products;
    }
  }

  // Traverse children
  if (Array.isArray(obj)) {
    for (const item of obj) {
      findProductsInObject(item, products, currentUrl, depth + 1);
    }
  } else {
    for (const key of Object.keys(obj)) {
      if (['products', 'product', 'items', 'catalog', 'pageProps'].includes(key)) {
        findProductsInObject(obj[key], products, currentUrl, depth + 1);
      }
    }
  }

  return products;
};

/**
 * Extracts products from framework hydration scripts (Next.js, Nuxt, Shopify)
 *
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} currentUrl
 * @returns {Array<Object>}
 */
const extractFromHydration = ($, currentUrl) => {
  const products = [];

  // 1. Next.js Hydration script
  const nextDataHtml = $('script#__NEXT_DATA__').html();
  if (nextDataHtml) {
    try {
      const nextData = JSON.parse(nextDataHtml);
      findProductsInObject(nextData.props?.pageProps, products, currentUrl);
    } catch {
      // Ignore parsing errors
    }
  }

  // 2. Shopify window object scripts
  $('script:not([src])').each((_, el) => {
    const text = $(el).html() || '';
    if (text.includes('var meta =') || text.includes('window.ShopifyAnalytics.meta')) {
      try {
        const match = text.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
          const metaObj = JSON.parse(match[1]);
          if (metaObj.product) {
            findProductsInObject(metaObj.product, products, currentUrl);
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }
  });

  return products;
};

module.exports = {
  extractFromHydration
};
