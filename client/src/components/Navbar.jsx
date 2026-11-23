import React from 'react';
import { Database, RefreshCw, Trash2, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Navbar({
  isScraping,
  totalProducts = 0,
  showSidebar = true,
  onToggleSidebar,
  onRefresh,
  onClearAll
}) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="navbar-left">
          {onToggleSidebar && (
            <button
              type="button"
              className="btn-sidebar-toggle"
              onClick={onToggleSidebar}
              title={showSidebar ? 'Hide Scraper Studio Sidebar' : 'Show Scraper Studio Sidebar'}
            >
              {showSidebar ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
          )}

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
        </div>

        {/* Right: Actions & Live Status */}
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
              <Trash2 size={14} />
              <span className="btn-label-responsive">Clear All</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isScraping}
            className="btn-secondary"
            title="Refresh Products & Statistics"
          >
            <RefreshCw size={14} className={isScraping ? 'animate-spin' : ''} />
            <span className="btn-label-responsive">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
