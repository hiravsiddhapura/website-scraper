import React from 'react';
import { Search, Globe, Tag, X, Layers, Cpu } from 'lucide-react';

export default function FilterBar({
  filters,
  availableWebsites = [],
  availableBrands = [],
  onFilterChange,
  onReset
}) {
  const hasActiveFilters =
    filters.search ||
    filters.sourceDomain ||
    filters.brand ||
    filters.pageType ||
    filters.extractionSource ||
    filters.rating ||
    filters.inStock !== '' ||
    filters.sortBy !== 'createdAt';

  return (
    <div className="filter-bar">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search items by title, brand, or description..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
        {filters.search && (
          <button className="clear-search-btn" onClick={() => onFilterChange('search', '')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="filters-row">
        {/* Website Domain Filter */}
        {availableWebsites.length > 1 && (
          <div className="filter-item">
            <select
              value={filters.sourceDomain}
              onChange={(e) => onFilterChange('sourceDomain', e.target.value)}
            >
              <option value="">🌐 All Websites</option>
              {availableWebsites.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Brand Filter */}
        {availableBrands.length > 0 && (
          <div className="filter-item">
            <select
              value={filters.brand}
              onChange={(e) => onFilterChange('brand', e.target.value)}
            >
              <option value="">🏷️ All Brands</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Type Filter (Detail vs Listing) */}
        <div className="filter-item">
          <select
            value={filters.pageType}
            onChange={(e) => onFilterChange('pageType', e.target.value)}
          >
            <option value="">📄 All Page Types</option>
            <option value="detail">Single Product Pages</option>
            <option value="listing">Catalog / Collection Items</option>
          </select>
        </div>

        {/* Extraction Method Filter */}
        <div className="filter-item">
          <select
            value={filters.extractionSource}
            onChange={(e) => onFilterChange('extractionSource', e.target.value)}
          >
            <option value="">⚡ All Extraction Methods</option>
            <option value="json-ld">Schema.org JSON-LD</option>
            <option value="opengraph">OpenGraph Meta</option>
            <option value="hydration">Framework Hydration</option>
            <option value="heuristic">Heuristic DOM</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div className="filter-item">
          <select
            value={filters.rating}
            onChange={(e) => onFilterChange('rating', e.target.value)}
          >
            <option value="">⭐ All Ratings</option>
            <option value="5">★★★★★ (5 Stars)</option>
            <option value="4">★★★★☆ (4 Stars)</option>
            <option value="3">★★★☆☆ (3 Stars)</option>
            <option value="2">★★☆☆☆ (2 Stars)</option>
            <option value="1">★☆☆☆☆ (1 Star)</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div className="filter-item">
          <select
            value={filters.inStock}
            onChange={(e) => onFilterChange('inStock', e.target.value)}
          >
            <option value="">📦 All Stock</option>
            <option value="true">In Stock Only</option>
            <option value="false">Out of Stock</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="filter-item">
          <select
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              onFilterChange('sortBy', sortBy);
              onFilterChange('order', order);
            }}
          >
            <option value="createdAt-desc">Newest Scraped</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Highest Rated</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={onReset} className="btn-text">
            <X size={14} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
