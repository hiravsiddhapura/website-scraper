import React from 'react';
import { Database, RefreshCw, Trash2, Sparkles, Activity } from 'lucide-react';

export default function Navbar({ isScraping, totalProducts = 0, onRefresh, onClearAll }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <Sparkles size={22} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1>OmniScrape</h1>
              <span className="brand-badge">Universal 2.0</span>
            </div>
            <p className="subtitle">Any-Website E-Commerce Product Extractor</p>
          </div>
        </div>

        <div className="navbar-actions">
          {/* Status Indicator */}
          {isScraping ? (
            <div className="status-badge running">
              <span className="pulse-dot"></span>
              <span>Scraping Pipeline Active...</span>
            </div>
          ) : (
            <div className="status-badge ready">
              <span className="ready-dot"></span>
              <span>Database Ready ({totalProducts} items)</span>
            </div>
          )}

          {/* Clear All Products Button */}
          {totalProducts > 0 && (
            <button
              onClick={onClearAll}
              disabled={isScraping}
              className="btn-danger-outline"
              title="Delete all products from database"
            >
              <Trash2 size={15} />
              <span>Clear All</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isScraping}
            className="btn-secondary"
            title="Refresh Products & Statistics"
          >
            <RefreshCw size={15} className={isScraping ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
