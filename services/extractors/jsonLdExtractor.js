const {
  cleanText,
  parsePrice,
  parseCurrency,
  resolveUrl,
  extractDomain
} = require('../../utils/scraperUtils');

/**
 * Normalizes Schema.org image values (string, array of strings, or ImageObject)
 */
const normalizeImage = (imageRaw, currentUrl) => {
  if (!imageRaw) return '';
  if (typeof imageRaw === 'string') return resolveUrl(imageRaw, currentUrl);
  if (Array.isArray(imageRaw) && imageRaw.length > 0) {
    const first = imageRaw[0];
    return typeof first === 'string'
      ? resolveUrl(first, currentUrl)
      : resolveUrl(first.url || first.contentUrl || '', currentUrl);
  }
  if (typeof imageRaw === 'object') {
    return resolveUrl(imageRaw.url || imageRaw.contentUrl || '', currentUrl);
  }
  return '';
};

/**
 * Parses Schema.org Offer object
 */
const parseOffers = (offers) => {
  if (!offers) {
    return { price: 0, currency: '$', inStock: true, availability: 'Available' };
  }

  // Handle array of offers (e.g. variants)
  const offer = Array.isArray(offers) ? offers[0] : offers;

  const rawPrice = offer.price || offer.lowPrice || offer.highPrice || 0;
  const currency = offer.priceCurrency || '$';
  const availabilityStr = String(offer.availability || '');
  const inStock = !availabilityStr.toLowerCase().includes('outofstock');
  const availability = inStock ? 'In stock' : 'Out of stock';

  return {
    price: parsePrice(String(rawPrice)),
    currency: parseCurrency(currency) || currency,
    inStock,
    availability
  };
};

/**
 * Extracts products from JSON-LD Schema.org scripts
 * Supports Shopify, WooCommerce, Magento, BigCommerce, Walmart, Amazon, etc.
 *
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} currentUrl
 * @returns {Array<Object>} Extracted products
 */
const extractFromJsonLd = ($, currentUrl) => {
  const products = [];
  const domain = extractDomain(currentUrl);

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawText = $(el).html();
      if (!rawText) return;

      const data = JSON.parse(rawText);
      const items = Array.isArray(data)
        ? data
        : data['@graph']
        ? data['@graph']
        : [data];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        // Case A: Single Product Detail Page Schema
        const type = String(item['@type'] || '');
        if (
          type.toLowerCase() === 'product' ||
          type.toLowerCase() === 'individualproduct'
        ) {
          const title = cleanText(item.name || item.title);
          const productUrl = resolveUrl(item.url || currentUrl, currentUrl);
          const imageUrl = normalizeImage(item.image, currentUrl);
          const offerInfo = parseOffers(item.offers);

          const brand =
            typeof item.brand === 'string'
              ? cleanText(item.brand)
              : cleanText(item.brand?.name || 'Generic');

          const description = cleanText(item.description || '').substring(0, 300);
          const sku = String(item.sku || item.productID || item.gtin || '');

          const rating = item.aggregateRating?.ratingValue
            ? Math.round(Number(item.aggregateRating.ratingValue))
            : 0;

          if (title) {
            products.push({
              title,
              price: offerInfo.price,
              currency: offerInfo.currency,
              availability: offerInfo.availability,
              inStock: offerInfo.inStock,
              imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
              productUrl,
              rating,
              category: cleanText(item.category || 'General'),
              brand,
              description,
              sku,
              sourceDomain: domain,
              pageType: 'detail',
              extractionSource: 'json-ld',
              confidenceScore: 98,
              scrapedAt: new Date()
            });
          }
        }

        // Case B: Collection / ItemList Catalog Schema
        if (type.toLowerCase() === 'itemlist' && Array.isArray(item.itemListElement)) {
          for (const listElement of item.itemListElement) {
            const productNode = listElement.item || listElement;
            const title = cleanText(productNode.name || productNode.title);
            const productUrl = resolveUrl(productNode.url || '', currentUrl);
            const imageUrl = normalizeImage(productNode.image, currentUrl);
            const offerInfo = parseOffers(productNode.offers);

            if (title && productUrl) {
              products.push({
                title,
                price: offerInfo.price,
                currency: offerInfo.currency,
                availability: offerInfo.availability,
                inStock: offerInfo.inStock,
                imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
                productUrl,
                rating: 0,
                category: 'General',
                brand: cleanText(productNode.brand?.name || 'Generic'),
                description: cleanText(productNode.description || '').substring(0, 200),
                sku: '',
                sourceDomain: domain,
                pageType: 'listing',
                extractionSource: 'json-ld',
                confidenceScore: 95,
                scrapedAt: new Date()
              });
            }
          }
        }
      }
    } catch {
      // Ignore invalid JSON-LD scripts
    }
  });

  return products;
};

module.exports = {
  extractFromJsonLd
};
