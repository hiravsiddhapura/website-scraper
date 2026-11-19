import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <p className="pagination-info">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total products)
      </p>

      <div className="pagination-buttons">
        <button
          className="btn-page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <span className="page-indicator">
          {currentPage} / {totalPages}
        </span>

        <button
          className="btn-page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
