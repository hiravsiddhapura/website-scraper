import React from 'react';
import { Search, Globe, Tag, X, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';

export default function FilterBar({
  filters,
  totalItems = 0,
  availableWebsites = [],
  availableBrands = [],
  onFilterChange,
  onReset
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.sourceDomain) ||
    Boolean(filters.brand) ||
    Boolean(filters.pageType) ||
    Boolean(filters.extractionSource) ||
    Boolean(filters.rating) ||
    filters.inStock !== '' ||
    filters.sortBy !== 'createdAt';

  return (
    <div className="filter-card">
      {/* Top Search & Active Count Row */}
      <div className="filter-top-row">
        <div className="search-input-wrap">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by title, brand, or description..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onFilterChange('search', '')}
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-top-actions">
          <span className="results-counter">
            Showing <strong>{totalItems}</strong> product{totalItems === 1 ? '' : 's'}
          </span>

          {hasActiveFilters && (
            <button type="button" onClick={onReset} className="btn-reset-filters">
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Domain Quick Tabs (if multiple websites exist) */}
      {availableWebsites.length > 1 && (
        <div className="domain-tabs-row">
          <span className="domain-tabs-label">Websites:</span>
          <div className="domain-tabs-scroll">
            <button
              type="button"
              className={`domain-tab ${filters.sourceDomain === '' ? 'active' : ''}`}
              onClick={() => onFilterChange('sourceDomain', '')}
            >
              All Websites
            </button>
            {availableWebsites.map((domain) => (
              <button
                key={domain}
                type="button"
                className={`domain-tab ${filters.sourceDomain === domain ? 'active' : ''}`}
                onClick={() => onFilterChange('sourceDomain', domain)}
              >
                <Globe size={11} />
                <span>{domain}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Select Controls Row */}
      <div className="filters-controls-grid">
        {/* Brand */}
        {availableBrands.length > 0 && (
          <div className="filter-select-wrap">
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

        {/* Stock Status */}
        <div className="filter-select-wrap">
          <select
            value={filters.inStock}
            onChange={(e) => onFilterChange('inStock', e.target.value)}
          >
            <option value="">📦 All Stock Status</option>
            <option value="true">In Stock Only</option>
            <option value="false">Out of Stock Only</option>
          </select>
        </div>

        {/* Page Type */}
        <div className="filter-select-wrap">
          <select
            value={filters.pageType}
            onChange={(e) => onFilterChange('pageType', e.target.value)}
          >
            <option value="">📄 All Page Types</option>
            <option value="listing">Catalog / Collection Items</option>
            <option value="detail">Single Product Pages</option>
          </select>
        </div>

        {/* Extraction Source */}
        <div className="filter-select-wrap">
          <select
            value={filters.extractionSource}
            onChange={(e) => onFilterChange('extractionSource', e.target.value)}
          >
            <option value="">⚡ All Extraction Methods</option>
            <option value="heuristic">Heuristic DOM</option>
            <option value="json-ld">Schema.org JSON-LD</option>
            <option value="hydration">Framework Hydration</option>
            <option value="opengraph">OpenGraph Meta</option>
          </select>
        </div>

        {/* Minimum Rating */}
        <div className="filter-select-wrap">
          <select
            value={filters.rating}
            onChange={(e) => onFilterChange('rating', e.target.value)}
          >
            <option value="">⭐ All Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="filter-select-wrap sort-select">
          <select
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              onFilterChange('sortBy', sortBy);
              onFilterChange('order', order);
            }}
          >
            <option value="createdAt-desc">🕒 Newest Scraped First</option>
            <option value="price-asc">💲 Price: Low to High</option>
            <option value="price-desc">💲 Price: High to Low</option>
            <option value="rating-desc">⭐ Rating: High to Low</option>
            <option value="title-asc">🔤 Title: A to Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
