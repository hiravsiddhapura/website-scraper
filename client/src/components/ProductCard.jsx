import React from 'react';
import { Star, ExternalLink, Trash2, Globe, Tag, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

export default function ProductCard({ product, onDelete }) {
  const formattedDate = new Date(product.scrapedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  return (
    <article className="product-card">
      {/* Product Image Wrap with Badges */}
      <div className="card-image-wrap">
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x500?text=No+Product+Image';
          }}
        />

        {/* Top Badges */}
        <div className="card-top-badges">
          <span className={`stock-badge ${product.inStock ? 'badge-in-stock' : 'badge-out-of-stock'}`}>
            <span className="stock-dot"></span>
            {product.availability || (product.inStock ? 'In stock' : 'Out of stock')}
          </span>

          {product.extractionSource && (
            <span className="source-tag" title={`Extracted via ${product.extractionSource}`}>
              <Sparkles size={10} /> {product.extractionSource}
            </span>
          )}
        </div>
      </div>

      {/* Product Body */}
      <div className="card-body">
        {/* Domain & Brand Meta Row */}
        <div className="card-meta">
          <div className="meta-left">
            <span className="domain-pill" title={`Source Domain: ${product.sourceDomain}`}>
              <Globe size={11} />
              <span>{product.sourceDomain || 'Web'}</span>
            </span>

            {product.brand && product.brand !== 'Generic' && (
              <span className="brand-pill" title={`Brand: ${product.brand}`}>
                <Tag size={10} />
                <span>{product.brand}</span>
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="rating-pill" title={`${product.rating} out of 5 stars`}>
              <Star size={11} fill="#f59e0b" color="#f59e0b" />
              <span>{product.rating}</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3 className="card-title" title={product.title}>
          {product.title}
        </h3>

        {/* Product Description */}
        {product.description && (
          <p className="card-description" title={product.description}>
            {product.description}
          </p>
        )}

        {/* Card Footer: Price & Direct Actions */}
        <div className="card-footer">
          <div className="price-tag">
            {product.price > 0 ? (
              <>
                <span className="currency">{product.currency || '$'}</span>
                <span className="amount">
                  {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </>
            ) : (
              <span className="price-unlisted">Price Unlisted</span>
            )}
          </div>

          <div className="card-actions">
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn link-btn"
              title="Open product on original website"
            >
              <span>Visit</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={() => onDelete(product._id, product.title)}
              className="action-btn delete-btn"
              title="Delete product from database"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
