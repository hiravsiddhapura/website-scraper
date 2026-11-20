import React, { useState } from 'react';
import {
  Play,
  Loader2,
  Globe,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Amazon Earbuds',
    url: 'https://www.amazon.in/s?k=earbuds',
    mode: 'auto'
  },
  {
    name: 'boAt Lifestyle Store',
    url: 'https://www.boat-lifestyle.com/',
    mode: 'auto'
  },
  {
    name: 'Books Catalog',
    url: 'https://books.toscrape.com/',
    mode: 'catalog'
  },
  {
    name: 'Single Book Detail',
    url: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    mode: 'single'
  },
  {
    name: 'Electronics Catalog',
    url: 'https://webscraper.io/test-sites/e-commerce/allinone',
    mode: 'catalog'
  },
  {
    name: 'Quotes Sandbox',
    url: 'https://quotes.toscrape.com/',
    mode: 'catalog'
  }
];

export default function ScraperPanel({
  isScraping,
  onStartScrape,
  statusMessage,
  isError,
  suggestedLinks = []
}) {
  const [url, setUrl] = useState('https://books.toscrape.com/');
  const [mode, setMode] = useState('auto');
  const [pageLimit, setPageLimit] = useState(1);
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

    const activeSelectors = {};
    Object.entries(selectors).forEach(([k, v]) => {
      if (v && v.trim()) activeSelectors[k] = v.trim();
    });

    onStartScrape({
      url,
      mode,
      pageLimit: Number(pageLimit),
      selectors: activeSelectors
    });
  };

  return (
    <div className="scraper-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="panel-badge-universal">
            <Sparkles size={14} /> Universal Any-Website Extractor
          </div>
          <h2>Scrape Any E-commerce Website</h2>
          <p>
            Paste any URL (Product Detail Page or Collection/Catalog) — extracts data automatically
          </p>
        </div>

        {/* Quick Presets */}
        <div className="preset-badges">
          <span className="preset-label">Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              className={`preset-btn ${url === preset.url ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset)}
              disabled={isScraping}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="scraper-form">
        <div className="form-group flex-2">
          <label>
            <Globe size={14} /> Target Webpage URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isScraping}
            placeholder="Paste any product or catalog link (e.g. https://store.com/collections/all)"
          />
        </div>

        <div className="form-group flex-1">
          <label>
            <ShoppingBag size={14} /> Extraction Mode
          </label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={isScraping}>
            <option value="auto">✨ Auto-Detect (Single or Catalog)</option>
            <option value="single">🔍 Single Product Page (PDP)</option>
            <option value="catalog">📦 Catalog / Collection Page (PLP)</option>
          </select>
        </div>

        {mode !== 'single' && (
          <div className="form-group flex-1">
            <label>
              <Layers size={14} /> Page Limit
            </label>
            <select
              value={pageLimit}
              onChange={(e) => setPageLimit(e.target.value)}
              disabled={isScraping}
            >
              <option value={1}>1 Page</option>
              <option value={2}>2 Pages</option>
              <option value={3}>3 Pages</option>
              <option value={5}>5 Pages</option>
              <option value={0}>All Available Pages</option>
            </select>
          </div>
        )}

        <div className="form-action">
          <button type="submit" disabled={isScraping} className="btn-primary">
            {isScraping ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Extracting Products...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Extract Products</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Advanced Custom Selectors Override */}
      <div className="advanced-toggle">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-toggle-advanced"
        >
          <Sliders size={14} />
          <span>{showAdvanced ? 'Hide Custom Selectors' : 'Custom Selectors Override (Optional)'}</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAdvanced && (
        <div className="advanced-selectors-grid">
          <div className="selector-field">
            <label>Item Container Selector:</label>
            <input
              type="text"
              placeholder=".product-card, article"
              value={selectors.itemSelector}
              onChange={(e) => handleSelectorChange('itemSelector', e.target.value)}
            />
          </div>
          <div className="selector-field">
            <label>Title Selector:</label>
            <input
              type="text"
              placeholder="h1, h3 a, .title"
              value={selectors.titleSelector}
              onChange={(e) => handleSelectorChange('titleSelector', e.target.value)}
            />
          </div>
          <div className="selector-field">
            <label>Price Selector:</label>
            <input
              type="text"
              placeholder=".price, span.amount"
              value={selectors.priceSelector}
              onChange={(e) => handleSelectorChange('priceSelector', e.target.value)}
            />
          </div>
          <div className="selector-field">
            <label>Image Selector:</label>
            <input
              type="text"
              placeholder="img.hero, .cover"
              value={selectors.imageSelector}
              onChange={(e) => handleSelectorChange('imageSelector', e.target.value)}
            />
          </div>
          <div className="selector-field">
            <label>Link Selector:</label>
            <input
              type="text"
              placeholder="a.product-link"
              value={selectors.linkSelector}
              onChange={(e) => handleSelectorChange('linkSelector', e.target.value)}
            />
          </div>
        </div>
      )}

      {statusMessage && (
        <div className={`status-banner ${isError ? 'banner-error' : 'banner-success'}`}>
          {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Discovered Collection Links for Homepages */}
      {suggestedLinks && suggestedLinks.length > 0 && (
        <div className="suggested-links-box">
          <p className="suggested-title">
            💡 <strong>Landing Page Hint:</strong> Homepages display promotional banners. Try extracting one of these direct collection or product links found on this website:
          </p>
          <div className="suggested-buttons">
            {suggestedLinks.map((link) => (
              <button
                key={link}
                type="button"
                className="btn-suggested"
                onClick={() => {
                  setUrl(link);
                  onStartScrape({ url: link, mode: 'auto', pageLimit: 1 });
                }}
              >
                <ExternalLink size={12} /> {link.replace(/^https?:\/\/[^\/]+/, '')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
