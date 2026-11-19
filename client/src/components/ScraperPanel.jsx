import React, { useState } from 'react';
import { Play, Loader2, Globe, Layers, ChevronDown, ChevronUp, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

const PRESETS = [
  {
    name: 'Books to Scrape (Books sandbox)',
    url: 'https://books.toscrape.com/'
  },
  {
    name: 'Quotes to Scrape (Quotes sandbox)',
    url: 'https://quotes.toscrape.com/'
  },
  {
    name: 'WebScraper.io (Electronics sandbox)',
    url: 'https://webscraper.io/test-sites/e-commerce/allinone'
  }
];

export default function ScraperPanel({ isScraping, onStartScrape, statusMessage, isError }) {
  const [url, setUrl] = useState('https://books.toscrape.com/');
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

  const handlePresetSelect = (presetUrl) => {
    setUrl(presetUrl);
  };

  const handleSelectorChange = (field, value) => {
    setSelectors((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean up empty selectors
    const activeSelectors = {};
    Object.entries(selectors).forEach(([k, v]) => {
      if (v && v.trim()) activeSelectors[k] = v.trim();
    });

    onStartScrape({
      url,
      pageLimit: Number(pageLimit),
      selectors: activeSelectors
    });
  };

  return (
    <div className="scraper-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <h2>Dynamic Multi-Website Scraper</h2>
          <p>Scrape any website automatically or use custom CSS selectors</p>
        </div>

        {/* Quick Presets */}
        <div className="preset-badges">
          <span className="preset-label">Quick Presets:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              className={`preset-btn ${url === preset.url ? 'active' : ''}`}
              onClick={() => handlePresetSelect(preset.url)}
              disabled={isScraping}
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="scraper-form">
        <div className="form-group flex-2">
          <label>
            <Globe size={14} /> Target Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isScraping}
            placeholder="Enter any website URL (e.g. https://example.com/products)"
          />
        </div>

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

        <div className="form-action">
          <button type="submit" disabled={isScraping} className="btn-primary">
            {isScraping ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Scraping Site...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Start Scraping</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Advanced Custom Selectors Toggle */}
      <div className="advanced-toggle">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-toggle-advanced"
        >
          <Sliders size={14} />
          <span>{showAdvanced ? 'Hide Custom Selectors' : 'Custom CSS Selectors (Optional Override)'}</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showAdvanced && (
        <div className="advanced-selectors-grid">
          <div className="selector-field">
            <label>Item Card Selector:</label>
            <input
              type="text"
              placeholder=".product-card, article.pod"
              value={selectors.itemSelector}
              onChange={(e) => handleSelectorChange('itemSelector', e.target.value)}
            />
          </div>
          <div className="selector-field">
            <label>Title Selector:</label>
            <input
              type="text"
              placeholder="h3 a, .title"
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
              placeholder="img.thumbnail, .cover"
              value={selectors.imageSelector}
              onChange={(e) => handleSelectorChange('imageSelector', e.target.value)}
            />
          </div>
          <div className="selector-field">
            <label>Link Selector:</label>
            <input
              type="text"
              placeholder="a.product-link, h3 a"
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
    </div>
  );
}
