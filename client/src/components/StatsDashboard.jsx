import React from 'react';
import { Package, CheckCircle2, XCircle, DollarSign, Layers } from 'lucide-react';

export default function StatsDashboard({ stats, activeCurrency = '$' }) {
  if (!stats) return null;

  // Resolve currency symbol dynamically
  const currencySymbol = activeCurrency || '$';

  return (
    <div className="stats-grid">
      {/* Total Products */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-icon bg-indigo">
            <Package size={20} />
          </div>
          <span className="stat-trend">Live</span>
        </div>
        <div className="stat-card-body">
          <p className="stat-label">Total Products</p>
          <h3 className="stat-value">{stats.totalProducts || 0}</h3>
          <p className="stat-subtext">
            Across {stats.websites?.length || 0} website{stats.websites?.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Available in Stock */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-icon bg-emerald">
            <CheckCircle2 size={20} />
          </div>
          <span className="stat-badge in-stock">
            {stats.totalProducts > 0
              ? `${Math.round(((stats.availableProducts || 0) / stats.totalProducts) * 100)}%`
              : '100%'}
          </span>
        </div>
        <div className="stat-card-body">
          <p className="stat-label">Available in Stock</p>
          <h3 className="stat-value text-emerald">{stats.availableProducts || 0}</h3>
          <p className="stat-subtext">Ready for purchase</p>
        </div>
      </div>

      {/* Out of Stock */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-icon bg-rose">
            <XCircle size={20} />
          </div>
          <span className="stat-badge out-stock">
            {stats.outOfStockProducts || 0} items
          </span>
        </div>
        <div className="stat-card-body">
          <p className="stat-label">Out of Stock</p>
          <h3 className="stat-value text-rose">{stats.outOfStockProducts || 0}</h3>
          <p className="stat-subtext">Unavailable items</p>
        </div>
      </div>

      {/* Average Price */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-icon bg-violet">
            <DollarSign size={20} />
          </div>
          <span className="stat-badge price-badge">Price Range</span>
        </div>
        <div className="stat-card-body">
          <p className="stat-label">Average Price</p>
          <h3 className="stat-value">
            {currencySymbol}
            {stats.pricing?.average ? stats.pricing.average.toFixed(2) : '0.00'}
          </h3>
          <p className="stat-subtext">
            {currencySymbol}{stats.pricing?.minimum || 0} – {currencySymbol}{stats.pricing?.maximum || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
