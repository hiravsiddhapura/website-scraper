import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsDashboard from './components/StatsDashboard';
import ScraperPanel from './components/ScraperPanel';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import Pagination from './components/Pagination';
import { getProducts, getStats, startScraper, deleteProduct } from './services/api';
import { Loader2, Inbox } from 'lucide-react';

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
      setStatusMessage(`Analyzing & scraping ${options.url} across multi-tier pipeline...`);

      const response = await startScraper(options);
      const summary = response.data;

      if (summary.totalProductsFound === 0 && summary.suggestedLinks?.length > 0) {
        setSuggestedLinks(summary.suggestedLinks);
        setStatusMessage(
          `Scraped homepage for ${summary.website}, but homepages rarely contain direct buyable cards. We discovered direct category links below:`
        );
      } else {
        setStatusMessage(
          `Success! Scraped ${summary.website} (${summary.pageType}) via [${summary.extractionMethod}]. Extracted ${summary.totalProductsFound} item(s) in ${summary.durationSeconds} (${summary.newInserted} new, ${summary.updatedExisting} updated).`
        );
      }

      await loadProducts();
      await loadStats();
    } catch (err) {
      setIsError(true);
      setStatusMessage(err.message || 'Scraper error occurred');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle Deleting Product
  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      loadStats();
    } catch (err) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        isScraping={isScraping}
        onRefresh={() => {
          loadProducts();
          loadStats();
        }}
      />

      <main className="main-content">
        {/* Statistics Metric Cards */}
        <StatsDashboard stats={stats} />

        {/* Universal Scraper Trigger Controls with Presets */}
        <ScraperPanel
          isScraping={isScraping}
          onStartScrape={handleStartScrape}
          statusMessage={statusMessage}
          isError={isError}
          suggestedLinks={suggestedLinks}
        />

        {/* Search, Website, Brand, Type and Status Filters */}
        <FilterBar
          filters={filters}
          availableWebsites={availableWebsites}
          availableBrands={availableBrands}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Products Grid */}
        <section className="products-section">
          {isLoading ? (
            <div className="loading-state">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p>Loading items from MongoDB...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Inbox size={48} className="empty-icon" />
              <h3>No Items Found</h3>
              <p>
                {filters.search || filters.sourceDomain || filters.brand || filters.rating || filters.pageType
                  ? 'No items match your active search filters.'
                  : 'Your database is currently empty. Enter any website URL above to scrape items!'}
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
