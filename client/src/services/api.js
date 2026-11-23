/**
 * Centralized API service for communicating with the Node.js backend
 * Supports dynamic production API URL via VITE_API_URL environment variable
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch scraped products with filtering, search and pagination
 */
export const getProducts = async (filters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/scraper/products?${query.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch products (HTTP ${response.status})`);
  }
  return response.json();
};

/**
 * Fetch database aggregation statistics
 */
export const getStats = async () => {
  const response = await fetch(`${API_BASE_URL}/scraper/stats`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch statistics (HTTP ${response.status})`);
  }
  return response.json();
};

/**
 * Fetch real-time scraping status
 */
export const getStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/scraper/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch scraper status');
  }
  return response.json();
};

/**
 * Trigger dynamic scraper job
 */
export const startScraper = async (options = {}) => {
  const response = await fetch(`${API_BASE_URL}/scraper/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Scraper job failed (HTTP ${response.status})`);
  }
  return data;
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/scraper/products/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Failed to delete product (HTTP ${response.status})`);
  }
  return data;
};

/**
 * Delete all scraped products from database
 */
export const deleteAllProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/scraper/products`, {
    method: 'DELETE'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Failed to clear products (HTTP ${response.status})`);
  }
  return data;
};
