import React from 'react';
import { Star, ExternalLink, Trash2, Globe, Tag, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

export default function ProductTableView({ products = [], onDelete }) {
  if (!products.length) return null;

  return (
    <div className="table-responsive-wrapper">
      <table className="products-table">
        <thead>
          <tr>
            <th className="th-image">Item</th>
            <th className="th-title">Product Details</th>
            <th className="th-source">Website / Source</th>
            <th className="th-price">Price</th>
            <th className="th-stock">Availability</th>
            <th className="th-rating">Rating</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const currency = product.currency || '$';
            const priceFormatted = product.price > 0
              ? `${currency}${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Unlisted';

            return (
              <tr key={product._id} className="table-product-row">
                {/* Image Thumbnail */}
                <td className="td-image">
                  <div className="table-thumb-wrap">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=No+Img';
                      }}
                    />
                  </div>
                </td>

                {/* Title & Brand */}
                <td className="td-title">
                  <div className="table-title-wrap">
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-product-title"
                      title={product.title}
                    >
                      {product.title}
                    </a>
                    <div className="table-meta-pills">
                      {product.brand && product.brand !== 'Generic' && (
                        <span className="brand-pill-sm">
                          <Tag size={10} />
                          {product.brand}
                        </span>
                      )}
                      {product.description && (
                        <span className="table-desc-preview" title={product.description}>
                          {product.description.slice(0, 85)}...
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Source Domain & Extraction Source */}
                <td className="td-source">
                  <div className="table-source-wrap">
                    <span className="domain-pill-sm" title={product.sourceDomain}>
                      <Globe size={11} />
                      {product.sourceDomain || 'Web'}
                    </span>
                    {product.extractionSource && (
                      <span className="source-tag-sm" title={`Engine: ${product.extractionSource}`}>
                        <Sparkles size={9} />
                        {product.extractionSource}
                      </span>
                    )}
                  </div>
                </td>

                {/* Price */}
                <td className="td-price">
                  <div className="table-price-wrap">
                    <span className={`table-price ${product.price > 0 ? '' : 'unlisted'}`}>
                      {priceFormatted}
                    </span>
                  </div>
                </td>

                {/* Stock Status */}
                <td className="td-stock">
                  <span className={`table-stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                    <span className="stock-dot"></span>
                    {product.availability || (product.inStock ? 'In Stock' : 'Out of Stock')}
                  </span>
                </td>

                {/* Rating */}
                <td className="td-rating">
                  {product.rating > 0 ? (
                    <div className="rating-pill-sm" title={`${product.rating} stars`}>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span>{product.rating}</span>
                    </div>
                  ) : (
                    <span className="text-dim-sm">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="td-actions">
                  <div className="table-actions-wrap">
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="table-action-btn visit-btn"
                      title="Open Original Webpage"
                    >
                      <ExternalLink size={13} />
                      <span>Visit</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onDelete(product._id, product.title)}
                      className="table-action-btn delete-btn"
                      title="Delete Product"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
