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
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const PRESETS = [
  {
    name: 'boAt Lifestyle',
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
    name: 'Single Book',
    icon: '📖',
    url: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    mode: 'single'
  },
  {
    name: 'Electronics',
    icon: '💻',
    url: 'https://webscraper.io/test-sites/e-commerce/allinone',
    mode: 'catalog'
  },
  {
    name: 'Quotes Sandbox',
    icon: '💬',
    url: 'https://quotes.toscrape.com/',
    mode: 'catalog'
  },
  {
    name: 'LinkedIn Profile',
    icon: '💼',
    url: 'https://www.linkedin.com/in/williamhgates',
    mode: 'single'
  }
];

export default function ScraperPanel({
  isScraping,
  onStartScrape,
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
    <div className="scraper-studio-card">
      {/* Studio Header */}
      <div className="studio-card-header">
        <div className="studio-title-row">
          <div className="studio-badge">
            <Sparkles size={13} />
            <span>Studio</span>
          </div>
          <span className="studio-pill">Universal Engine</span>
        </div>
        <h2 className="studio-heading">Extract </h2>
        <p className="studio-subtext">
          Enter any e-commerce link or select a preset to extract live products instantly.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="studio-presets-section">
        <span className="studio-section-label">Quick Presets:</span>
        <div className="studio-presets-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              className={`studio-preset-pill ${url === preset.url ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset)}
              disabled={isScraping}
              title={preset.url}
            >
              <span className="preset-emoji">{preset.icon}</span>
              <span className="preset-name">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Extraction Form */}
      <form onSubmit={handleSubmit} className="studio-form">
        {/* Target URL */}
        <div className="studio-field">
          <label htmlFor="target-url" className="studio-label">
            <Globe size={13} />
            <span>Target Webpage URL</span>
          </label>
          <div className="studio-input-wrap">
            <input
              id="target-url"
              type="url"
              required
              placeholder="https://example.com/products..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScraping}
            />
            {url && (
              <button
                type="button"
                className="studio-input-clear"
                onClick={() => setUrl('')}
                title="Clear URL"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Mode & Page Limit Row */}
        <div className="studio-row-2col">
          <div className="studio-field">
            <label htmlFor="scrape-mode" className="studio-label">
              <Layers size={13} />
              <span>Mode</span>
            </label>
            <select
              id="scrape-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              disabled={isScraping}
            >
              <option value="auto">Auto-Detect</option>
              <option value="catalog">Catalog (PLP)</option>
              <option value="single">Single (PDP)</option>
            </select>
          </div>

          <div className="studio-field">
            <label htmlFor="page-limit" className="studio-label">
              <span>Pages</span>
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
              <option value={0}>All Pages</option>
            </select>
          </div>
        </div>

        {/* Replace Previous Toggle Switch */}
        <div className="studio-toggle-field">
          <label className="studio-switch-label" title="Clears existing products so only newly scraped items appear">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              disabled={isScraping}
              className="studio-checkbox"
            />
            <span className="studio-switch-track">
              <span className="studio-switch-thumb"></span>
            </span>
            <div className="studio-switch-text">
              <strong>Replace previous list</strong>
              <small>Auto-deletes old products on scrape</small>
            </div>
          </label>
        </div>

        {/* Big Action Button */}
        <button
          type="submit"
          disabled={isScraping || !url.trim()}
          className={`btn-studio-extract ${isScraping ? 'is-loading' : ''}`}
        >
          {isScraping ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Extracting Live Data...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Extract Products</span>
            </>
          )}
        </button>

        {/* Advanced Selectors Toggle */}
        <button
          type="button"
          className="btn-studio-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Sliders size={13} />
          <span>Custom CSS Selectors</span>
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Collapsible Advanced Form */}
        {showAdvanced && (
          <div className="studio-advanced-panel">
            <p className="studio-advanced-hint">Override with custom selectors:</p>
            <div className="studio-advanced-grid">
              <div className="studio-adv-field">
                <label>Card Container</label>
                <input
                  type="text"
                  placeholder=".product-item, .card"
                  value={selectors.itemSelector}
                  onChange={(e) => handleSelectorChange('itemSelector', e.target.value)}
                />
              </div>
              <div className="studio-adv-field">
                <label>Title Selector</label>
                <input
                  type="text"
                  placeholder="h3 a, .title"
                  value={selectors.titleSelector}
                  onChange={(e) => handleSelectorChange('titleSelector', e.target.value)}
                />
              </div>
              <div className="studio-adv-field">
                <label>Price Selector</label>
                <input
                  type="text"
                  placeholder=".price, .amount"
                  value={selectors.priceSelector}
                  onChange={(e) => handleSelectorChange('priceSelector', e.target.value)}
                />
              </div>
              <div className="studio-adv-field">
                <label>Image Selector</label>
                <input
                  type="text"
                  placeholder="img.product-img"
                  value={selectors.imageSelector}
                  onChange={(e) => handleSelectorChange('imageSelector', e.target.value)}
                />
              </div>
              <div className="studio-adv-field">
                <label>Link Selector</label>
                <input
                  type="text"
                  placeholder="a.product-link"
                  value={selectors.linkSelector}
                  onChange={(e) => handleSelectorChange('linkSelector', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Suggested Subcategories */}
      {suggestedLinks && suggestedLinks.length > 0 && (
        <div className="studio-suggested-box">
          <div className="studio-suggested-header">
            <Sparkles size={13} />
            <span>Discovered Categories:</span>
          </div>
          <div className="studio-suggested-chips">
            {suggestedLinks.slice(0, 4).map((link, idx) => (
              <button
                key={idx}
                type="button"
                className="studio-suggested-chip"
                onClick={() => {
                  setUrl(link);
                  setMode('catalog');
                }}
              >
                <span>{link.replace(/^https?:\/\/[^\/]+/, '') || link}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status / Alert Banner */}
      {statusMessage && (
        <div className={`studio-status-banner ${isError ? 'banner-error' : isScraping ? 'banner-scraping' : 'banner-success'}`}>
          <div className="banner-icon">
            {isError ? (
              <AlertCircle size={16} />
            ) : isScraping ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </div>
          <div className="banner-text">{statusMessage}</div>
        </div>
      )}
    </div>
  );
}
