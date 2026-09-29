import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable enterprise Pagination component.
 * 
 * @param {number} currentPage - Currently active 1-indexed page
 * @param {number} totalItems - Total count of items in the dataset
 * @param {number} pageSize - Number of items displayed per page
 * @param {function} onPageChange - Callback when a page is selected
 */
export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array (with truncation if lots of pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className={`pagination-container ${className}`}>
      <div className="pagination-info">
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> entries
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="pagination-pages">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              type="button"
              className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
