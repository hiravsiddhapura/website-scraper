const axios = require('axios');
const cheerio = require('cheerio');
const { cleanText } = require('../utils/scraperUtils');

/**
 * Service to fetch LinkedIn Member Profile Data
 * Strategy 1: Direct Live Public Metadata (via Social Crawler headers - NO API Key required!)
 * Strategy 2: RapidAPI (Fresh LinkedIn Profile Data) if RAPIDAPI_KEY is configured
 * Strategy 3: Proxycurl API if PROXYCURL_API_KEY is configured
 */

/**
 * Extracts username handle from a LinkedIn URL
 * e.g., https://www.linkedin.com/in/hirav-siddhapura/ -> hirav-siddhapura
 */
const extractLinkedInHandle = (url) => {
  const match = url.match(/linkedin\.com\/in\/([^\/\?#]+)/i);
  return match ? match[1].replace(/\/+$/, '') : '';
};

/**
 * Strategy 1: Direct Live Extraction using social crawler headers
 * Bypasses LinkedIn 999 authwall to extract live full name, headline, experience, and profile photo!
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
    maxRedirects: 5,
    timeout: 12000,
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
    fullName = handle
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
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
      } else if (trimmed.startsWith('Education:')) {
        // Can be appended or used if needed
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
    imageUrl: ogImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
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
 * Strategy 2: Fetch via RapidAPI (Fresh LinkedIn Profile Data)
 */
const fetchViaRapidAPI = async (url, apiKey) => {
  const handle = extractLinkedInHandle(url);
  const response = await axios.get('https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile', {
    params: {
      linkedin_url: url,
      include_skills: 'false'
    },
    headers: {
      'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com',
      'x-rapidapi-key': apiKey
    },
    timeout: 20000
  });

  const data = response.data?.data || response.data;
  if (!data) throw new Error('No profile data returned by RapidAPI');

  const fullName = cleanText(`${data.first_name || ''} ${data.last_name || ''}`) || data.full_name || handle;
  const headline = cleanText(data.headline || data.job_title || 'LinkedIn Member');
  const company = cleanText(data.company || data.current_company_name || (data.experiences && data.experiences[0]?.company) || 'Professional');
  const location = cleanText(data.location || data.city || 'Global');
  const imageUrl = data.profile_image_url || data.profile_pic_url || data.avatar || '';

  return {
    title: fullName,
    price: 0,
    currency: '',
    availability: location,
    inStock: true,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    productUrl: url,
    rating: 5,
    category: 'LinkedIn Profile',
    brand: company,
    description: headline,
    sku: handle,
    sourceDomain: 'linkedin.com',
    pageType: 'detail',
    extractionSource: 'rapidapi',
    confidenceScore: 99,
    scrapedAt: new Date()
  };
};

/**
 * Strategy 3: Fetch via Proxycurl API
 */
const fetchViaProxycurl = async (url, apiKey) => {
  const response = await axios.get('https://nubela.co/proxycurl/api/v2/linkedin', {
    params: {
      url: url,
      fallback_to_cache: 'on-error',
      use_cache: 'if-present'
    },
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    timeout: 25000
  });

  const data = response.data;
  const fullName = cleanText(`${data.first_name || ''} ${data.last_name || ''}`) || data.full_name;
  const headline = cleanText(data.headline || 'LinkedIn Member');
  const company = cleanText((data.experiences && data.experiences[0]?.company) || 'Professional');
  const location = cleanText(`${data.city || ''} ${data.country_full_name || ''}`).trim() || 'Global';
  const imageUrl = data.profile_pic_url || '';

  return {
    title: fullName,
    price: 0,
    currency: '',
    availability: location,
    inStock: true,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    productUrl: url,
    rating: 5,
    category: 'LinkedIn Profile',
    brand: company,
    description: headline,
    sku: extractLinkedInHandle(url),
    sourceDomain: 'linkedin.com',
    pageType: 'detail',
    extractionSource: 'proxycurl',
    confidenceScore: 99,
    scrapedAt: new Date()
  };
};

/**
 * Main Controller:
 * 1. Tries Direct Live Extraction (fast, free, no API key needed!)
 * 2. Falls back to RapidAPI or Proxycurl if configured
 */
const fetchLinkedInMember = async (url) => {
  // 1. Try Direct Live Extraction
  try {
    const liveProfile = await fetchLivePublicProfile(url);
    if (liveProfile && liveProfile.title && liveProfile.imageUrl) {
      console.log(`[LinkedIn] Successfully extracted live profile for: ${liveProfile.title}`);
      return liveProfile;
    }
  } catch (err) {
    console.warn(`[LinkedIn] Direct extraction failed (${err.message}). Trying API keys...`);
  }

  // 2. Try RapidAPI if configured
  if (process.env.RAPIDAPI_KEY) {
    try {
      return await fetchViaRapidAPI(url, process.env.RAPIDAPI_KEY);
    } catch (err) {
      console.warn(`[LinkedIn] RapidAPI error: ${err.message}`);
    }
  }

  // 3. Try Proxycurl if configured
  if (process.env.PROXYCURL_API_KEY) {
    try {
      return await fetchViaProxycurl(url, process.env.PROXYCURL_API_KEY);
    } catch (err) {
      console.warn(`[LinkedIn] Proxycurl error: ${err.message}`);
    }
  }

  throw new Error(
    `Unable to fetch LinkedIn profile for ${url}. The profile might be private or restricted.`
  );
};

module.exports = {
  fetchLinkedInMember,
  extractLinkedInHandle
};
