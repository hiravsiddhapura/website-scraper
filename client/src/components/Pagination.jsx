import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-wrapper">
      <div className="pagination-summary">
        Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total products)
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="page-nav-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="page-numbers">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }

            return (
              <button
                key={pageNum}
                type="button"
                className={`page-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="page-nav-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
