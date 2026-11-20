const {
  cleanText,
  parsePrice,
  parseCurrency,
  parseRating,
  resolveUrl,
  extractDomain
} = require('../../utils/scraperUtils');

const PRICE_REGEX = /(?:[\$£€₹¥]|Rs\.?|CAD|USD|GBP|EUR)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;

const IGNORED_TITLE_WORDS = [
  'sponsored',
  'advertisement',
  'let us know',
  'view details',
  'add to cart',
  'quick view',
  'learn more',
  'buy now',
  'see more'
];

const isInvalidTitle = (text) => {
  if (!text || text.length < 3) return true;
  const lower = text.toLowerCase().trim();
  const alphaOnly = lower.replace(/[^a-z]/g, '');

  if (
    alphaOnly.includes('sponsored') ||
    alphaOnly.includes('advertisement') ||
    alphaOnly === 'letusknow' ||
    alphaOnly === 'addtocart' ||
    alphaOnly === 'quickview' ||
    alphaOnly === 'buynow'
  ) {
    return true;
  }

  return (
    PRICE_REGEX.test(text) ||
    IGNORED_TITLE_WORDS.some((word) => lower === word || lower.startsWith(word + ' '))
  );
};

/**
 * Extracts product title from an element with clear hierarchical priority
 * Handles headings, specialized title classes, and anchor tags
 */
const extractCardTitle = ($, el) => {
  // 1. Explicit title classes on links or inside elements
  const titled = $(el)
    .find('a[class*="title"], [class*="title"] a, a[class*="name"], [class*="name"] a')
    .filter((_, t) => !isInvalidTitle($(t).text()));
  if (titled.length) {
    const titleEl = titled.first();
    return { title: cleanText(titleEl.attr('title') || titleEl.text()), el: titleEl };
  }

  // 2. Heading links (h1 a, h2 a, h3 a, h4 a, h5 a)
  const headingLinks = $(el)
    .find('h1 a, h2 a, h3 a, h4 a, h5 a')
    .filter((_, h) => !isInvalidTitle($(h).text()));
  if (headingLinks.length) {
    const titleEl = headingLinks.first();
    return { title: cleanText(titleEl.attr('title') || titleEl.text()), el: titleEl };
  }

  // 3. Headings that are NOT prices and NOT invalid
  const headings = $(el)
    .find('h1, h2, h3, h4, h5')
    .filter((_, h) => !isInvalidTitle($(h).text()) && !$(h).attr('class')?.includes('price'));
  if (headings.length) {
    const titleEl = headings.first();
    return { title: cleanText(titleEl.attr('title') || titleEl.text()), el: titleEl };
  }

  // 4. Product links
  const productLinks = $(el)
    .find('a[href*="/product/"], a[href*="/products/"], a[href*="/p/"]')
    .not(':has(img)')
    .filter((_, a) => !isInvalidTitle($(a).text()));
  if (productLinks.length) {
    const titleEl = productLinks.first();
    return { title: cleanText(titleEl.attr('title') || titleEl.text()), el: titleEl };
  }

  // 5. Any link that is not an image and not a price
  const anyLink = $(el)
    .find('a')
    .not(':has(img)')
    .filter((_, a) => !isInvalidTitle($(a).text()))
    .first();
  if (anyLink.length) {
    return { title: cleanText(anyLink.attr('title') || anyLink.text()), el: anyLink };
  }

  return { title: '', el: $() };
};

/**
 * Extracts product image from card, prioritizing primary product images
 * and filtering out decorative badges, review stars, and tracking pixels
 */
const extractCardImage = ($, el, currentUrl) => {
  let imgEl = $(el)
    .find(
      'img.s-image, img[class*="primary"], [class*="image-wrapper"] img, [class*="product-image"] img, .aspect-ratio img, .thumbnail img'
    )
    .first();

  if (!imgEl.length) {
    imgEl = $(el)
      .find('img')
      .filter((_, img) => {
        const src = (
          $(img).attr('src') ||
          $(img).attr('data-src') ||
          $(img).attr('data-lazy-src') ||
          ''
        ).toLowerCase();
        return (
          src.length > 0 &&
          !src.includes('star') &&
          !src.includes('icon') &&
          !src.includes('label') &&
          !src.includes('mask_group') &&
          !src.includes('badge') &&
          !src.includes('logo') &&
          !src.includes('pixel')
        );
      })
      .first();
  }

  if (!imgEl.length) {
    imgEl = $(el).find('img').first();
  }

  const rawImg =
    imgEl.attr('src') ||
    imgEl.attr('data-src') ||
    imgEl.attr('data-lazy-src') ||
    imgEl.attr('srcset')?.split(' ')[0] ||
    imgEl.attr('data-srcset')?.split(' ')[0];

  return resolveUrl(rawImg, currentUrl);
};

/**
 * Extracts rating value (1-5) from card or page element
 */
const extractCardRating = ($, el) => {
  const dataRating =
    $(el).find('[data-rating]').attr('data-rating') ||
    $(el).find('[aria-label*="star"], [aria-label*="out of"]').attr('aria-label') ||
    $(el).find('.a-icon-alt').first().text();
  if (dataRating) {
    return parseRating(dataRating);
  }

  const starAttr =
    $(el).find('.star-rating, [class*="star-rating"]').first().attr('class') ||
    $(el).find('[class*="star"], [class*="rating"]').first().text();
  return parseRating(starAttr);
};

/**
 * Derives friendly brand name from domain or product title
 */
const deriveBrand = (title, domain) => {
  if (domain.includes('boat-lifestyle')) return 'boAt';
  if (domain.includes('books.toscrape')) return 'Books to Scrape';
  if (domain.includes('webscraper.io')) return 'WebScraper.io';
  if (domain.includes('amazon')) return 'Amazon';
  if (domain.includes('shopify')) return 'Shopify';

  // If first word of title looks like a brand (capitalized, >= 3 chars)
  const firstWord = (title || '').split(' ')[0];
  if (firstWord && /^[A-Z][a-zA-Z0-9]{2,}$/.test(firstWord)) {
    return firstWord;
  }

  // Format domain (e.g. "my-awesome-store.com" -> "My Awesome Store")
  const baseDomain = domain.split('.')[0] || domain;
  return baseDomain
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Heuristic extractor for Single Product Detail Pages (PDP)
 * Works across any e-commerce platform with zero metadata
 *
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} currentUrl
 * @returns {Object | null}
 */
const extractSingleProductHeuristic = ($, currentUrl) => {
  const domain = extractDomain(currentUrl);

  // 1. Primary Title: Look for H1 tag (standard on e-commerce product pages)
  let title = cleanText(
    $('.product_main h1, h1, [class*="product-title"], [class*="product-name"], .product_title')
      .first()
      .text()
  );

  // 2. Locate Price
  let rawPrice = '';
  const priceElements = $(
    '.product_main .price_color, [class*="price"]:not(:has([class*="price"])), [id*="price"], .amount, [itemprop="price"], [data-price]'
  );

  priceElements.each((_, el) => {
    const text = cleanText($(el).text());
    if (PRICE_REGEX.test(text) && !rawPrice) {
      rawPrice = text;
    }
  });

  if (!rawPrice) {
    const bodyText = $('body').text();
    const match = bodyText.match(PRICE_REGEX);
    if (match) rawPrice = match[0];
  }

  const price = parsePrice(rawPrice);
  const currency = parseCurrency(rawPrice);

  // 3. Find Product Hero Image
  let imageUrl = '';
  const heroImageSelectors = [
    '#product_gallery img',
    '.item.active img',
    '[class*="product-image"] img',
    '[class*="gallery"] img',
    '[class*="featured-image"] img',
    '#main-image',
    'img[itemprop="image"]',
    'main img',
    'article img'
  ];

  for (const selector of heroImageSelectors) {
    const imgEl = $(selector).first();
    const src =
      imgEl.attr('src') ||
      imgEl.attr('data-src') ||
      imgEl.attr('data-zoom-image') ||
      imgEl.attr('srcset')?.split(' ')[0];
    if (src && !src.includes('logo') && !src.includes('icon')) {
      imageUrl = resolveUrl(src, currentUrl);
      break;
    }
  }

  // 4. Cart / Purchase Button
  const hasCartButton =
    $('button, a, input[type="submit"]').filter((_, el) => {
      const text = ($(el).text() || $(el).val() || '').toLowerCase();
      return (
        text.includes('add to basket') ||
        text.includes('add to cart') ||
        text.includes('add to bag') ||
        text.includes('buy now')
      );
    }).length > 0;

  // 5. Availability
  const rawAvailability = cleanText(
    $('.product_main .availability, [class*="availability"], [class*="stock"]').first().text()
  );
  const isOutOfStock =
    rawAvailability.toLowerCase().includes('out of stock') ||
    rawAvailability.toLowerCase().includes('sold out');
  const inStock = !isOutOfStock;
  const availability = rawAvailability || (inStock ? 'In stock' : 'Out of stock');

  // 6. Rating
  const rating = extractCardRating($, $('body'));

  // 7. Category & Description
  const category =
    cleanText($('ul.breadcrumb li:nth-child(3) a, .breadcrumb a:last-child').text()) || 'General';

  const description = cleanText(
    $('#product_description + p, [class*="description"], #description').first().text()
  ).substring(0, 350);

  const brand = deriveBrand(title, domain);

  if (title && (price > 0 || hasCartButton || imageUrl)) {
    return {
      title,
      price,
      currency,
      availability,
      inStock,
      imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
      productUrl: currentUrl,
      rating,
      category,
      brand,
      description,
      sku: '',
      sourceDomain: domain,
      pageType: 'detail',
      extractionSource: 'heuristic',
      confidenceScore: hasCartButton && price > 0 ? 88 : 75,
      scrapedAt: new Date()
    };
  }

  return null;
};

/**
 * Heuristic extractor for Multi-Product Catalog / Listing Pages (PLP)
 * Identifies repeated sibling product cards across arbitrary shops
 *
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} currentUrl
 * @returns {Array<Object>}
 */
const extractCatalogHeuristic = ($, currentUrl) => {
  const domain = extractDomain(currentUrl);
  const products = [];
  const seenUrls = new Set();

  const candidateSelectors = [
    'div[data-component-type="s-search-result"]',
    '[data-asin]:has(img):has(a)',
    'article.product_pod',
    '.product-item',
    '.product-card',
    '[class*="product-card"]',
    '[class*="product-item"]',
    '[class*="product_pod"]',
    '[class*="product-grid-item"]',
    '.grid-product',
    '.thumbnail:has(a)',
    '.product:has(a):has(img)',
    '.item-card',
    '.col-md-3:has(img):has(a)',
    '.col-md-4:has(img):has(a)'
  ];

  let selectedElements = $();

  for (const selector of candidateSelectors) {
    const rawMatches = $(selector);
    if (rawMatches.length >= 2) {
      // Filter out nested cards: only keep top-level matching ancestors
      const topLevelCards = rawMatches.filter((_, el) => {
        return $(el).parents(selector).length === 0;
      });

      // Ensure cards have at least an anchor and either text or an image
      const validCards = topLevelCards.filter((_, el) => {
        const hasLink = $(el).find('a').length > 0 || $(el).is('a');
        const hasContent = $(el).find('img').length > 0 || $(el).text().length > 15;
        return hasLink && hasContent;
      });

      if (validCards.length >= 2) {
        selectedElements = validCards;
        break;
      }
    }
  }

  // Adaptive Heuristic Discovery: If no predefined classes match, dynamically discover
  // repeating containers across ANY e-commerce platform that combine a price, an image, and a link
  if (selectedElements.length < 2) {
    const discoveredCards = [];
    const seenCardElements = new Set();

    // 1. Find price candidate nodes
    $('*').each((_, el) => {
      if ($(el).children().length <= 2) {
        const text = $(el).text().trim();
        if (PRICE_REGEX.test(text) && text.length < 50) {
          // Climb up to find the closest card container with an image and link
          let current = $(el).parent();
          let depth = 0;
          let bestCard = null;

          while (
            current.length &&
            depth < 6 &&
            current[0].tagName !== 'BODY' &&
            current[0].tagName !== 'HTML'
          ) {
            const hasImg = current.find('img').length > 0;
            const hasLink = current.find('a').length > 0;
            if (hasImg && hasLink) {
              bestCard = current[0];
              // Stop climbing if container is a card (not an entire page section with > 20 links)
              if (current.find('a').length <= 20) {
                break;
              }
            }
            current = current.parent();
            depth++;
          }

          if (bestCard && !seenCardElements.has(bestCard)) {
            seenCardElements.add(bestCard);
            discoveredCards.push(bestCard);
          }
        }
      }
    });

    // 2. Also check anchors linking to products
    if (discoveredCards.length < 2) {
      const productAnchors = $('a[href*="/product/"], a[href*="/products/"], a[href*="/p/"]').filter(
        (_, a) => {
          const href = $(a).attr('href') || '';
          return !href.includes('#') && !href.includes('cart');
        }
      );

      productAnchors.each((_, anchor) => {
        const parentCard = $(anchor).closest(
          'article, li, [class*="item"], [class*="col"], div:has(img)'
        );
        if (parentCard.length && !seenCardElements.has(parentCard[0])) {
          seenCardElements.add(parentCard[0]);
          discoveredCards.push(parentCard[0]);
        }
      });
    }

    if (discoveredCards.length >= 2) {
      selectedElements = $(discoveredCards);
    }
  }

  selectedElements.each((_, el) => {
    const { title, el: titleEl } = extractCardTitle($, el);

    const relativeUrl =
      titleEl.attr('href') ||
      $(el).find('a.a-link-normal[href*="/dp/"], h2 a, a[href*="/product/"], a[href*="/products/"], a[href*="/p/"]').first().attr('href') ||
      $(el).find('a').first().attr('href');
    const productUrl = resolveUrl(relativeUrl, currentUrl);

    // Extract price
    const priceText = cleanText(
      $(el).find('.a-price .a-offscreen, .a-price-whole, .price_color, [class*="price"], .amount, [data-price], [itemprop="price"]').first().text()
    );
    const price = parsePrice(priceText);
    const currency = parseCurrency(priceText);

    // Extract image
    const imageUrl = extractCardImage($, el, currentUrl);

    // Extract rating
    const rating = extractCardRating($, el);

    // Extract stock status
    const cardText = $(el).text().toLowerCase();
    const isOutOfStock = cardText.includes('out of stock') || cardText.includes('sold out');
    const inStock = !isOutOfStock;
    const availability = inStock ? 'In stock' : 'Out of stock';

    const brand = deriveBrand(title, domain);

    if (
      title &&
      title.length > 2 &&
      productUrl &&
      productUrl !== currentUrl &&
      !seenUrls.has(productUrl)
    ) {
      seenUrls.add(productUrl);
      products.push({
        title,
        price,
        currency,
        availability,
        inStock,
        imageUrl: imageUrl || 'https://placehold.co/400x500?text=No+Product+Image',
        productUrl,
        rating,
        category: 'General',
        brand,
        description: '',
        sku: '',
        sourceDomain: domain,
        pageType: 'listing',
        extractionSource: 'heuristic',
        confidenceScore: price > 0 ? 82 : 72,
        scrapedAt: new Date()
      });
    }
  });

  return products;
};

module.exports = {
  extractSingleProductHeuristic,
  extractCatalogHeuristic
};
