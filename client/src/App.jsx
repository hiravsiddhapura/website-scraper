import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsDashboard from './components/StatsDashboard';
import ScraperPanel from './components/ScraperPanel';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import Pagination from './components/Pagination';
import { getProducts, getStats, startScraper, deleteProduct, deleteAllProducts } from './services/api';
import { Loader2, Inbox, Sparkles } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [availableWebsites, setAvailableWebsites] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [suggestedLinks, setSuggestedLinks] = useState([]);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    sourceDomain: '',
    brand: '',
    pageType: '',
    extractionSource: '',
    rating: '',
    inStock: '',
    sortBy: 'createdAt',
    order: 'desc'
  });

  // Load products from backend
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getProducts({
        page: currentPage,
        limit: 12,
        ...filters
      });
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
      if (data.availableWebsites) setAvailableWebsites(data.availableWebsites);
      if (data.availableBrands) setAvailableBrands(data.availableBrands);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  // Load aggregate stats
  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts();
    loadStats();
  }, [loadProducts, loadStats]);

  // Handle filter changes (resets to page 1)
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      sourceDomain: '',
      brand: '',
      pageType: '',
      extractionSource: '',
      rating: '',
      inStock: '',
      sortBy: 'createdAt',
      order: 'desc'
    });
    setCurrentPage(1);
  };

  // Handle Triggering Universal Scraper Job
  const handleStartScrape = async (options) => {
    try {
      setIsScraping(true);
      setIsError(false);
      setSuggestedLinks([]);
      
      const cleanActionMsg = options.clearExisting
        ? `Wiping previous products & scraping ${options.url}...`
        : `Analyzing & scraping ${options.url}...`;
      setStatusMessage(cleanActionMsg);

      const response = await startScraper(options);
      const summary = response.data;

      if (summary.totalProductsFound === 0 && summary.suggestedLinks?.length > 0) {
        setSuggestedLinks(summary.suggestedLinks);
        setStatusMessage(
          `Scraped ${summary.website}, but no buyable cards were found directly on this page. Discovered category links below:`
        );
      } else {
        const replaceNote = options.clearExisting ? ' (Previous items cleared)' : '';
        setStatusMessage(
          `Success! Scraped ${summary.website} (${summary.pageType}) via [${summary.extractionMethod}]. Extracted ${summary.totalProductsFound} item(s) in ${summary.durationSeconds}${replaceNote}.`
        );
      }

      // Reset to page 1 and reload
      setCurrentPage(1);
      await loadProducts();
      await loadStats();
    } catch (err) {
      setIsError(true);
      setStatusMessage(err.message || 'Scraper error occurred');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle Deleting Single Product
  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      loadStats();
      loadProducts();
    } catch (err) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  // Handle Clearing All Products (Wipe Database)
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products from your database? This will clear the entire product list.')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteAllProducts();
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setStatusMessage('Successfully cleared all products from database.');
      setIsError(false);
      await loadStats();
    } catch (err) {
      alert(`Failed to clear products: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine active currency symbol from first product
  const activeCurrency = products[0]?.currency || '$';

  return (
    <div className="app-layout">
      {/* Sleek Top Navbar */}
      <Navbar
        isScraping={isScraping}
        totalProducts={totalProducts}
        onRefresh={() => {
          loadProducts();
          loadStats();
        }}
        onClearAll={handleClearAll}
      />

      <main className="main-content">
        {/* Statistics Metric Cards */}
        <StatsDashboard stats={stats} activeCurrency={activeCurrency} />

        {/* Universal Scraper Controls with Replace Toggle */}
        <ScraperPanel
          isScraping={isScraping}
          onStartScrape={handleStartScrape}
          onClearAll={handleClearAll}
          totalProducts={totalProducts}
          statusMessage={statusMessage}
          isError={isError}
          suggestedLinks={suggestedLinks}
        />

        {/* Search, Website, Brand, Type and Status Filters */}
        <FilterBar
          filters={filters}
          totalItems={totalProducts}
          availableWebsites={availableWebsites}
          availableBrands={availableBrands}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Products Grid */}
        <section className="products-section">
          {isLoading ? (
            <div className="loading-state">
              <Loader2 size={38} className="animate-spin text-primary" />
              <p>Loading products from MongoDB...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Inbox size={48} />
              </div>
              <h3>No Products in List</h3>
              <p>
                {filters.search || filters.sourceDomain || filters.brand || filters.rating || filters.pageType
                  ? 'No items match your active search filters. Try clearing filters.'
                  : 'Your database is currently empty. Paste any product link or click a preset above to extract items!'}
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pagination Navigation */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProducts}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </main>
    </div>
  );
}
