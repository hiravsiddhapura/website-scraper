import React from 'react';
import { Database, RefreshCw, Activity } from 'lucide-react';

export default function Navbar({ isScraping, onRefresh }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <Database size={24} />
          </div>
          <div>
            <h1>Website Data Scraper</h1>
            <p className="subtitle">Node.js · Express · Cheerio · MongoDB · React</p>
          </div>
        </div>

        <div className="navbar-actions">
          {isScraping && (
            <div className="status-badge running">
              <span className="pulse-dot"></span>
              Scraping In Progress...
            </div>
          )}

          <button onClick={onRefresh} className="btn-secondary" title="Refresh Products & Stats">
            <RefreshCw size={16} className={isScraping ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
