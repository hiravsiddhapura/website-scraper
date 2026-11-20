const {
  cleanText,
  parsePrice,
  parseCurrency,
  resolveUrl,
  extractDomain
} = require('../../utils/scraperUtils');

/**
 * Extracts product information from OpenGraph, Twitter Cards, and HTML5 Microdata
 *
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} currentUrl
 * @returns {Object | null}
 */
const extractFromMetaTags = ($, currentUrl) => {
  const domain = extractDomain(currentUrl);

  // 1. Title
  const title = cleanText(
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('meta[name="title"]').attr('content') ||
    $('title').text()
  );

  // 2. Price & Currency
  const rawPrice =
    $('meta[property="product:price:amount"]').attr('content') ||
    $('meta[property="og:price:amount"]').attr('content') ||
    $('meta[name="price"]').attr('content') ||
    $('[itemprop="price"]').attr('content') ||
    $('[itemprop="price"]').text() ||
    '';

  const rawCurrency =
    $('meta[property="product:price:currency"]').attr('content') ||
    $('meta[property="og:price:currency"]').attr('content') ||
    $('[itemprop="priceCurrency"]').attr('content') ||
    '$';

  const price = parsePrice(rawPrice);
  const currency = parseCurrency(rawCurrency) || rawCurrency;

  // 3. Image URL
  const rawImage =
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('[itemprop="image"]').attr('src') ||
    $('[itemprop="image"]').attr('content') ||
    '';
  const imageUrl = resolveUrl(rawImage, currentUrl);

  // 4. Availability & Stock
  const rawAvailability =
    $('meta[property="product:availability"]').attr('content') ||
    $('meta[property="og:availability"]').attr('content') ||
    $('[itemprop="availability"]').attr('href') ||
    $('[itemprop="availability"]').attr('content') ||
    '';

  const inStock = !rawAvailability.toLowerCase().includes('out of stock') &&
                  !rawAvailability.toLowerCase().includes('outofstock');
  const availability = inStock ? 'In stock' : 'Out of stock';

  // 5. Brand & Description
  const brand = cleanText(
    $('meta[property="product:brand"]').attr('content') ||
    $('[itemprop="brand"]').text() ||
    'Generic'
  );

  const description = cleanText(
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('[itemprop="description"]').text() ||
    ''
  ).substring(0, 300);

  // Check if we have minimum valid product signals
  const isProductOgType = $('meta[property="og:type"]').attr('content')?.toLowerCase() === 'product';
  const hasPrice = price > 0;

  if (title && (isProductOgType || hasPrice || imageUrl)) {
    return {
      title,
      price,
      currency,
      availability,
      inStock,
      imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
      productUrl: currentUrl,
      rating: 0,
      category: 'General',
      brand,
      description,
      sku: '',
      sourceDomain: domain,
      pageType: 'detail',
      extractionSource: 'opengraph',
      confidenceScore: 88,
      scrapedAt: new Date()
    };
  }

  return null;
};

module.exports = {
  extractFromMetaTags
};
