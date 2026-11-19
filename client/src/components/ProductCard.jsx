import React from 'react';
import { Star, ExternalLink, Trash2, Calendar, Globe } from 'lucide-react';

export default function ProductCard({ product, onDelete }) {
  const formattedDate = new Date(product.scrapedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="product-card">
      <div className="card-image-wrap">
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://placehold.co/200x280?text=No+Cover';
          }}
        />
        <span className={`stock-badge ${product.inStock ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
          {product.availability}
        </span>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <div className="meta-left">
            <span className="domain-pill" title={`Scraped from ${product.sourceDomain}`}>
              <Globe size={11} /> {product.sourceDomain || 'Web'}
            </span>
            <span className="category-pill">{product.category || 'General'}</span>
          </div>

          {product.rating > 0 && (
            <div className="rating-stars" title={`${product.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={13}
                  className={star <= product.rating ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
          )}
        </div>

        <h3 className="card-title" title={product.title}>
          {product.title}
        </h3>

        <div className="card-footer">
          <div className="price-tag">
            {product.price > 0 ? (
              <>
                <span className="currency">{product.currency || '£'}</span>
                <span className="amount">{product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="free-tag">N/A</span>
            )}
          </div>

          <div className="card-actions">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn link-btn"
              title="View on original website"
            >
              <ExternalLink size={16} />
            </a>

            <button
              onClick={() => onDelete(product._id, product.title)}
              className="action-btn delete-btn"
              title="Delete from MongoDB"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="card-timestamp">
          <Calendar size={12} />
          <span>Scraped: {formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
