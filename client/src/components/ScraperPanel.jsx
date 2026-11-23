import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Loader2,
  Globe,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

const PRESETS = [
  {
    name: 'boAt Lifestyle Store',
    icon: '🎧',
    url: 'https://www.boat-lifestyle.com/',
    mode: 'auto'
  },
  {
    name: 'Books Catalog',
    icon: '📚',
    url: 'https://books.toscrape.com/',
    mode: 'catalog'
  },
  {
    name: 'Single Book Detail',
    icon: '📖',
    url: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    mode: 'single'
  },
  {
    name: 'Electronics Catalog',
    icon: '💻',
    url: 'https://webscraper.io/test-sites/e-commerce/allinone',
    mode: 'catalog'
  },
  {
    name: 'Quotes Sandbox',
    icon: '💬',
    url: 'https://quotes.toscrape.com/',
    mode: 'catalog'
  }
];

export default function ScraperPanel({
  isScraping,
  onStartScrape,
  onClearAll,
  totalProducts = 0,
  statusMessage,
  isError,
  suggestedLinks = []
}) {
  const [url, setUrl] = useState('https://books.toscrape.com/');
  const [mode, setMode] = useState('auto');
  const [pageLimit, setPageLimit] = useState(1);
  const [clearExisting, setClearExisting] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Custom selectors state
  const [selectors, setSelectors] = useState({
    itemSelector: '',
    titleSelector: '',
    priceSelector: '',
    imageSelector: '',
    linkSelector: ''
  });

  const handlePresetSelect = (preset) => {
    setUrl(preset.url);
    setMode(preset.mode);
  };

  const handleSelectorChange = (field, value) => {
    setSelectors((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url || !url.trim()) return;

    const activeSelectors = {};
    Object.entries(selectors).forEach(([k, v]) => {
      if (v && v.trim()) activeSelectors[k] = v.trim();
    });

    onStartScrape({
      url: url.trim(),
      mode,
      pageLimit: Number(pageLimit),
      clearExisting,
      selectors: activeSelectors
    });
  };

  return (
    <div className="scraper-card">
      {/* Panel Header */}
      <div className="scraper-card-header">
        <div className="header-info">
          <div className="badge-sparkle">
            <Sparkles size={13} /> Universal Any-Website Extractor
          </div>
          <h2>Extract Products from Any URL</h2>
          <p>
            Paste any e-commerce link (Shopify, WooCommerce, Catalog or Single Item) — our multi-engine extractor pulls products automatically.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="presets-container">
          <span className="presets-title">Quick Presets:</span>
          <div className="presets-list">
            {PRESETS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                className={`preset-pill ${url === preset.url ? 'active' : ''}`}
                onClick={() => handlePresetSelect(preset)}
                disabled={isScraping}
              >
                <span className="preset-emoji">{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Scraper Form */}
      <form onSubmit={handleSubmit} className="scraper-form">
        <div className="form-main-row">
          {/* Target URL Input */}
          <div className="url-input-container">
            <label htmlFor="target-url" className="form-label">
              <Globe size={14} /> Target Webpage URL
            </label>
            <div className="input-with-icon">
              <input
                id="target-url"
                type="url"
                required
                placeholder="https://example.com/products or /collections/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isScraping}
              />
              {url && (
                <button
                  type="button"
                  className="input-clear-btn"
                  onClick={() => setUrl('')}
                  title="Clear URL"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mode-select-container">
            <label htmlFor="scrape-mode" className="form-label">
              <Layers size={14} /> Extraction Mode
            </label>
            <select
              id="scrape-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              disabled={isScraping}
            >
              <option value="auto">✨ Auto-Detect (Single or Catalog)</option>
              <option value="catalog">📚 Catalog / Collection (PLP)</option>
              <option value="single">🔍 Single Product Detail (PDP)</option>
            </select>
          </div>

          {/* Page Limit */}
          <div className="limit-select-container">
            <label htmlFor="page-limit" className="form-label">
              📄 Page Limit
            </label>
            <select
              id="page-limit"
              value={pageLimit}
              onChange={(e) => setPageLimit(Number(e.target.value))}
              disabled={isScraping || mode === 'single'}
            >
              <option value={1}>1 Page</option>
              <option value={2}>2 Pages</option>
              <option value={5}>5 Pages</option>
              <option value={10}>10 Pages</option>
              <option value={0}>All Pages (Deep Crawl)</option>
            </select>
          </div>

          {/* Submit Action Button */}
          <div className="action-button-container">
            <button
              type="submit"
              disabled={isScraping || !url.trim()}
              className="btn-extract-primary"
            >
              {isScraping ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <Play size={17} fill="currentColor" />
                  <span>Extract Products</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Previous Option Toggle (User Request: Delete first product in list when getting new link) */}
        <div className="scraper-options-row">
          <label className="replace-toggle-label" title="When enabled, removes previously scraped products so only items from the new URL appear in your list.">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              disabled={isScraping}
              className="replace-checkbox"
            />
            <span className="toggle-custom"></span>
            <span className="toggle-text">
              <strong>Replace previous products on scrape</strong> (clears old list so only new products are displayed)
            </span>
          </label>

          <div className="options-right">
            {totalProducts > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                disabled={isScraping}
                className="btn-text-danger"
                title="Wipe all products from database now"
              >
                <Trash2 size={13} />
                <span>Clear Current List ({totalProducts})</span>
              </button>
            )}

            <button
              type="button"
              className="advanced-toggle-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Sliders size={13} />
              <span>Custom CSS Selectors (Optional)</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Optional Custom CSS Selectors Accordion */}
        {showAdvanced && (
          <div className="advanced-selectors-panel">
            <div className="advanced-hint">
              Override universal heuristics by specifying exact CSS selectors for custom or obscure sites:
            </div>
            <div className="selectors-grid">
              <div className="selector-field">
                <label>Card Container</label>
                <input
                  type="text"
                  placeholder="e.g. .product-item, .card"
                  value={selectors.itemSelector}
                  onChange={(e) => handleSelectorChange('itemSelector', e.target.value)}
                />
              </div>
              <div className="selector-field">
                <label>Title Selector</label>
                <input
                  type="text"
                  placeholder="e.g. h3 a, .title"
                  value={selectors.titleSelector}
                  onChange={(e) => handleSelectorChange('titleSelector', e.target.value)}
                />
              </div>
              <div className="selector-field">
                <label>Price Selector</label>
                <input
                  type="text"
                  placeholder="e.g. .price, .amount"
                  value={selectors.priceSelector}
                  onChange={(e) => handleSelectorChange('priceSelector', e.target.value)}
                />
              </div>
              <div className="selector-field">
                <label>Image Selector</label>
                <input
                  type="text"
                  placeholder="e.g. img.product-img"
                  value={selectors.imageSelector}
                  onChange={(e) => handleSelectorChange('imageSelector', e.target.value)}
                />
              </div>
              <div className="selector-field">
                <label>Link Selector</label>
                <input
                  type="text"
                  placeholder="e.g. a.product-link"
                  value={selectors.linkSelector}
                  onChange={(e) => handleSelectorChange('linkSelector', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Discovered Subcategory Links (Homepage guidance) */}
      {suggestedLinks && suggestedLinks.length > 0 && (
        <div className="suggested-links-box">
          <div className="suggested-header">
            <Sparkles size={15} />
            <span>Discovered Product Categories (Click to scrape directly):</span>
          </div>
          <div className="suggested-chips">
            {suggestedLinks.map((link, idx) => (
              <button
                key={idx}
                type="button"
                className="suggested-chip"
                onClick={() => {
                  setUrl(link);
                  setMode('catalog');
                }}
              >
                <span>{link.replace(/^https?:\/\/[^\/]+/, '') || link}</span>
                <ArrowRight size={13} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Status / Notification Banner */}
      {statusMessage && (
        <div className={`status-banner ${isError ? 'banner-error' : isScraping ? 'banner-scraping' : 'banner-success'}`}>
          <div className="banner-icon">
            {isError ? (
              <AlertCircle size={18} />
            ) : isScraping ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
          </div>
          <div className="banner-message">{statusMessage}</div>
        </div>
      )}
    </div>
  );
}
