import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsDashboard from './components/StatsDashboard';
import ScraperPanel from './components/ScraperPanel';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import ProductTableView from './components/ProductTableView';
import Pagination from './components/Pagination';
import { getProducts, getStats, startScraper, deleteProduct, deleteAllProducts } from './services/api';
import { Loader2, Inbox, Sparkles, ArrowRight } from 'lucide-react';

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

  // Layout states: Grid vs Table view, and Sidebar visibility
  const [viewMode, setViewMode] = useState('grid');
  const [showSidebar, setShowSidebar] = useState(true);

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
      setStatusMessage(
        options.clearExisting
          ? 'Clearing previous items & scraping live webpage...'
          : 'Scraping live webpage...'
      );

      const res = await startScraper(options);

      if (res.success) {
        const count = res.summary?.savedCount || res.summary?.itemsFound || 0;
        const previousCleared = res.summary?.previousCleared ? ' (Previous items deleted)' : '';
        setStatusMessage(
          `Extracted ${count} products from ${options.url}${previousCleared}`
        );

        if (res.discoveredLinks && res.discoveredLinks.length > 0) {
          setSuggestedLinks(res.discoveredLinks);
        } else {
          setSuggestedLinks([]);
        }

        // Refresh products list and stats
        setCurrentPage(1);
        await loadProducts();
        await loadStats();
      } else {
        setIsError(true);
        setStatusMessage(res.message || 'Scraping completed with warnings');
      }
    } catch (err) {
      console.error('Scrape job failed:', err);
      setIsError(true);
      setStatusMessage(err.message || 'Error occurred while contacting scraping engine');
    } finally {
      setIsScraping(false);
    }
  };

  // Handle Deleting a Single Product
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
      {/* Sleek Top Navbar with Sidebar Toggle */}
      <Navbar
        isScraping={isScraping}
        totalProducts={totalProducts}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onRefresh={() => {
          loadProducts();
          loadStats();
        }}
        onClearAll={handleClearAll}
      />

      <main className="main-content">
        <div className={`dashboard-layout ${!showSidebar ? 'sidebar-collapsed' : ''}`}>
          {/* Left Column: Scraper Studio Sidebar */}
          {showSidebar && (
            <aside className="sidebar-studio">
              <ScraperPanel
                isScraping={isScraping}
                onStartScrape={handleStartScrape}
                totalProducts={totalProducts}
                statusMessage={statusMessage}
                isError={isError}
                suggestedLinks={suggestedLinks}
              />
            </aside>
          )}

          {/* Right Column: Live Products Explorer */}
          <section className="products-explorer">
            {/* Sleek, Space-Saving Horizontal KPI Strip */}
            {stats && (
              <StatsDashboard stats={stats} activeCurrency={activeCurrency} compact={true} />
            )}

            {/* Interactive Search, Dropdowns, and View Mode Toggle */}
            <FilterBar
              filters={filters}
              totalItems={totalProducts}
              availableWebsites={availableWebsites}
              availableBrands={availableBrands}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
            />

            {/* Products Canvas - Immediately in view on load! */}
            <div className="products-view-container">
              {isLoading ? (
                <div className="loading-state">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <p>Loading live products from MongoDB...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Inbox size={46} />
                  </div>
                  <h3>No Products Found</h3>
                  <p>
                    {filters.search || filters.sourceDomain || filters.brand || filters.rating || filters.inStock
                      ? 'No items match your active filters. Try clearing search or filter selections.'
                      : 'Your product list is currently empty. Enter any URL or choose a preset in the Studio to extract products!'}
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                <ProductTableView
                  products={products}
                  onDelete={handleDeleteProduct}
                />
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
            </div>

            {/* Pagination Navigation */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProducts}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
