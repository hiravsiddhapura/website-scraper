import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, totalItems, onPageChange, pageSize = 12 }) {
  if (totalPages <= 1) return null;

  // Calculate item range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate smart page list with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  const handlePageSelect = (page) => {
    if (page === '...' || page === currentPage) return;
    onPageChange(page);

    // Smoothly scroll up so user sees new page products
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pagination-card">
      {/* Left: Summary text with item count badge */}
      <div className="pagination-summary">
        Showing{' '}
        <span className="pagination-range">
          {startItem}–{endItem}
        </span>{' '}
        of <strong className="pagination-total">{totalItems}</strong> products
        <span className="pagination-page-pill">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Right: Controls & Page Numbers */}
      <div className="pagination-actions">
        {/* Previous Button */}
        <button
          type="button"
          className="btn-page-nav"
          disabled={currentPage <= 1}
          onClick={() => handlePageSelect(currentPage - 1)}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        {/* Numbered Pills */}
        <div className="pagination-numbers-list">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`dots-${index}`} className="pagination-dots">
                  •••
                </span>
              );
            }

            const isActive = currentPage === page;
            return (
              <button
                key={page}
                type="button"
                className={`btn-page-num ${isActive ? 'active' : ''}`}
                onClick={() => handlePageSelect(page)}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          className="btn-page-nav"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageSelect(currentPage + 1)}
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
