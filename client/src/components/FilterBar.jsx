import React from 'react';
import { Search, Globe, Tag, X, RotateCcw, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

export default function FilterBar({
  filters,
  totalItems = 0,
  availableWebsites = [],
  availableBrands = [],
  viewMode = 'grid',
  onViewModeChange,
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
    <div className="filter-studio-bar">
      {/* Search Input & View Toggle Row */}
      <div className="filter-main-row">
        {/* Search Input */}
        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
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
              <X size={13} />
            </button>
          )}
        </div>

        {/* Quick Dropdowns Row */}
        <div className="filter-dropdowns-group">
          {/* Stock Filter */}
          <select
            className="filter-select-sm"
            value={filters.inStock}
            onChange={(e) => onFilterChange('inStock', e.target.value)}
          >
            <option value="">📦 All Stock</option>
            <option value="true">✅ In Stock</option>
            <option value="false">❌ Out of Stock</option>
          </select>

          {/* Rating Filter */}
          <select
            className="filter-select-sm"
            value={filters.rating}
            onChange={(e) => onFilterChange('rating', e.target.value)}
          >
            <option value="">⭐ All Ratings</option>
            <option value="4">⭐⭐⭐⭐ 4+ Stars</option>
            <option value="3">⭐⭐⭐ 3+ Stars</option>
            <option value="2">⭐⭐ 2+ Stars</option>
          </select>

          {/* Sort By */}
          <select
            className="filter-select-sm"
            value={`${filters.sortBy}-${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-');
              onFilterChange('sortBy', sortBy);
              onFilterChange('order', order);
            }}
          >
            <option value="createdAt-desc">⏱️ Newest First</option>
            <option value="price-asc">💵 Price: Low to High</option>
            <option value="price-desc">💎 Price: High to Low</option>
            <option value="rating-desc">⭐ Highest Rated</option>
          </select>

          {/* Brand Filter (if available) */}
          {availableBrands.length > 0 && (
            <select
              className="filter-select-sm"
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
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="btn-filter-reset"
              title="Reset all active filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="view-mode-toggle" title="Switch layout display">
          <button
            type="button"
            className={`btn-toggle-view ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => onViewModeChange && onViewModeChange('grid')}
            title="Grid Cards View"
          >
            <LayoutGrid size={15} />
            <span className="view-label">Grid</span>
          </button>
          <button
            type="button"
            className={`btn-toggle-view ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => onViewModeChange && onViewModeChange('table')}
            title="Table List View"
          >
            <List size={15} />
            <span className="view-label">List</span>
          </button>
        </div>
      </div>

      {/* Domain Quick Tabs (when multiple websites scraped) */}
      {availableWebsites.length > 1 && (
        <div className="filter-domains-row">
          <span className="domains-label">Websites:</span>
          <div className="domains-scroll">
            <button
              type="button"
              className={`domain-chip ${filters.sourceDomain === '' ? 'active' : ''}`}
              onClick={() => onFilterChange('sourceDomain', '')}
            >
              All Domains ({totalItems})
            </button>
            {availableWebsites.map((domain) => (
              <button
                key={domain}
                type="button"
                className={`domain-chip ${filters.sourceDomain === domain ? 'active' : ''}`}
                onClick={() => onFilterChange('sourceDomain', domain)}
              >
                <Globe size={11} />
                <span>{domain}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
