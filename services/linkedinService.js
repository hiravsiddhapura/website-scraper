const axios = require('axios');
const cheerio = require('cheerio');
const { cleanText } = require('../utils/scraperUtils');

/**
 * Service to fetch LinkedIn Member Profile Data
 * Fast, responsive, with 5s timeout and graceful fallback for private/404 profiles
 */

const extractLinkedInHandle = (url) => {
  const match = (url || '').match(/linkedin\.com\/in\/([^\/\?#]+)/i);
  return match ? match[1].replace(/\/+$/, '') : '';
};

const formatNameFromHandle = (handle) => {
  if (!handle) return 'LinkedIn Member';
  // Strip trailing numbers (e.g. mihir-malaviya-994580203 -> mihir-malaviya)
  const cleanHandle = handle.replace(/-[0-9a-f]{6,}$/i, '').replace(/-[0-9]{5,}$/i, '');
  return cleanHandle
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Strategy 1: Direct Live Public Extraction via social crawler headers
 * Fast 5s timeout to prevent UI freezes
 */
const fetchLivePublicProfile = async (url) => {
  const handle = extractLinkedInHandle(url);
  const cleanUrl = `https://www.linkedin.com/in/${handle}/`;

  console.log(`[LinkedIn] Fetching live public profile for: ${cleanUrl}`);

  const response = await axios.get(cleanUrl, {
    headers: {
      'User-Agent': 'Twitterbot/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    maxRedirects: 4,
    timeout: 5000, // Fast 5s timeout
    validateStatus: (status) => status === 200
  });

  const $ = cheerio.load(response.data);
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';

  if (!ogTitle && !ogDesc && !ogImage) {
    throw new Error('No public metadata returned by LinkedIn');
  }

  // Parse Name from og:title (e.g. "Hirav Siddhapura - India | Professional Profile | LinkedIn")
  let fullName = ogTitle.split(' - ')[0].split(' | ')[0].trim();
  if (!fullName || fullName.toLowerCase().includes('linkedin')) {
    fullName = cleanText($('title').text().split(' - ')[0].split(' | ')[0]);
  }
  if (!fullName || fullName.toLowerCase().includes('linkedin')) {
    fullName = formatNameFromHandle(handle);
  }

  // Parse Experience, Location, and Headline from og:description
  let headline = '';
  let company = 'Professional';
  let location = 'India';

  if (ogDesc) {
    const parts = ogDesc.split(' · ');
    headline = parts[0] ? cleanText(parts[0]) : '';

    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('Experience:')) {
        company = cleanText(trimmed.replace('Experience:', ''));
      } else if (trimmed.startsWith('Location:')) {
        location = cleanText(trimmed.replace('Location:', ''));
      }
    });
  }

  return {
    title: fullName,
    price: 0,
    currency: '',
    availability: location,
    inStock: true,
    imageUrl: ogImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    productUrl: cleanUrl,
    rating: 5,
    category: 'LinkedIn Profile',
    brand: company,
    description: headline || 'Professional LinkedIn Profile',
    sku: handle,
    sourceDomain: 'linkedin.com',
    pageType: 'detail',
    extractionSource: 'linkedin-live',
    confidenceScore: 98,
    scrapedAt: new Date()
  };
};

/**
 * Fallback when profile is private or not publicly indexed
 * Returns immediately so UI NEVER freezes!
 */
const getFallbackProfile = (url, reason = 'Profile is private or restricted on LinkedIn') => {
  const handle = extractLinkedInHandle(url);
  const fullName = formatNameFromHandle(handle);

  return {
    title: fullName,
    price: 0,
    currency: '',
    availability: 'Private / Sign-in required',
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    productUrl: url,
    rating: 5,
    category: 'LinkedIn Profile',
    brand: 'LinkedIn Member',
    description: `LinkedIn Member (${reason}). Click 'View' to view their full profile directly on LinkedIn.`,
    sku: handle,
    sourceDomain: 'linkedin.com',
    pageType: 'detail',
    extractionSource: 'linkedin-public-handle',
    confidenceScore: 85,
    scrapedAt: new Date()
  };
};

/**
 * Main Controller:
 * 1. Tries Direct Live Extraction (fast 5s)
 * 2. Tries API keys if present
 * 3. Gracefully returns fallback so request NEVER hangs or freezes!
 */
const fetchLinkedInMember = async (url) => {
  // 1. Try Direct Live Extraction
  try {
    const liveProfile = await fetchLivePublicProfile(url);
    if (liveProfile && liveProfile.title) {
      console.log(`[LinkedIn] Successfully extracted live profile for: ${liveProfile.title}`);
      return liveProfile;
    }
  } catch (err) {
    console.warn(`[LinkedIn] Direct extraction failed (${err.message}). Checking fallbacks...`);
  }

  // 2. Try RapidAPI if configured
  if (process.env.RAPIDAPI_KEY) {
    try {
      const rapidProfile = await fetchViaRapidAPI(url, process.env.RAPIDAPI_KEY);
      if (rapidProfile) return rapidProfile;
    } catch (err) {
      console.warn(`[LinkedIn] RapidAPI error: ${err.message}`);
    }
  }

  // 3. Graceful fallback (NEVER HANGS OR FREEZES)
  console.log(`[LinkedIn] Returning clean public profile placeholder for handle.`);
  return getFallbackProfile(url);
};

module.exports = {
  fetchLinkedInMember,
  extractLinkedInHandle
};
