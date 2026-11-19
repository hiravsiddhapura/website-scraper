import React from 'react';
import { BookOpen, CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function StatsDashboard({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon bg-blue">
          <BookOpen size={20} />
        </div>
        <div>
          <p className="stat-label">Total Books</p>
          <h3 className="stat-value">{stats.totalProducts || 0}</h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon bg-green">
          <CheckCircle size={20} />
        </div>
        <div>
          <p className="stat-label">Available in Stock</p>
          <h3 className="stat-value">{stats.availableProducts || 0}</h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon bg-red">
          <XCircle size={20} />
        </div>
        <div>
          <p className="stat-label">Out of Stock</p>
          <h3 className="stat-value">{stats.outOfStockProducts || 0}</h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon bg-purple">
          <DollarSign size={20} />
        </div>
        <div>
          <p className="stat-label">Average Price</p>
          <h3 className="stat-value">
            £{stats.pricing?.average ? stats.pricing.average.toFixed(2) : '0.00'}
          </h3>
          <p className="stat-subtext">
            Range: £{stats.pricing?.minimum || 0} – £{stats.pricing?.maximum || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
