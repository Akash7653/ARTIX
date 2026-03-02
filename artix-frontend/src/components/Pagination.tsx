import React from 'react';

/**
 * Accessible Pagination Component
 * WCAG 2.1 Level AA compliant pagination controls
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  loading = false
}: PaginationProps) {
  const pageNumbers = [];
  const maxVisiblePages = 5;
  const halfWindow = Math.floor(maxVisiblePages / 2);
  
  let startPage = Math.max(1, currentPage - halfWindow);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex flex-col gap-4 items-center py-4">
      {/* Page Size Selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Items per page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            aria-label="Items per page"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {/* Pagination Controls */}
      <nav aria-label="Pagination" className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
          aria-label="Go to previous page"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1" role="group" aria-label="Page numbers">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                disabled={loading}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 py-1">...</span>}
            </>
          )}

          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              aria-label={`Go to page ${pageNum}`}
              aria-current={pageNum === currentPage ? 'page' : undefined}
              className={`px-3 py-2 border rounded transition-colors ${
                pageNum === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 py-1">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={loading}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          aria-label="Go to next page"
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </nav>

      {/* Page Info */}
      <p className="text-sm text-gray-600 dark:text-gray-400" role="status">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </p>
    </div>
  );
}

/**
 * Compact Pagination - for smaller screens
 */
interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function CompactPagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}: CompactPaginationProps) {
  return (
    <div className="flex items-center gap-2 py-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || loading}
        aria-label="Previous page"
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ←
      </button>
      
      <span className="text-sm text-gray-700 dark:text-gray-300" role="status">
        {currentPage} / {totalPages}
      </span>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || loading}
        aria-label="Next page"
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        →
      </button>
    </div>
  );
}

/**
 * Results Per Page Selector
 */
interface ResultsPerPageProps {
  value: number;
  options?: number[];
  onChange: (value: number) => void;
  label?: string;
}

export function ResultsPerPage({
  value,
  options = [5, 10, 25, 50, 100],
  onChange,
  label = 'Results per page'
}: ResultsPerPageProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="results-per-page" className="text-sm text-gray-700 dark:text-gray-300">
        {label}:
      </label>
      <select
        id="results-per-page"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default {
  Pagination,
  CompactPagination,
  ResultsPerPage
};
