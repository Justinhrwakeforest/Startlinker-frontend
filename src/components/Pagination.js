// src/components/Pagination.js - Reusable Pagination Component
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalResults,
  resultsPerPage = 20,
  onPageChange,
  showResultsInfo = true,
  className = '',
  scrollToTop = true
}) => {
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page (if it's not already included)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page) => {
    onPageChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) {
    return showResultsInfo && totalResults > 0 ? (
      <div className="flex justify-center mt-8">
        <div className="text-sm text-gray-600">
          Showing {totalResults} result{totalResults !== 1 ? 's' : ''}
        </div>
      </div>
    ) : null;
  }

  return (
    <div className={`mt-8 ${className}`}>
      {/* Pagination Controls - Centered */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center px-4 py-3 text-base font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center space-x-1">
          {pageNumbers.map((pageNum, index) => (
            pageNum === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 shadow-sm hover:shadow-md'
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        {/* Mobile Page Info */}
        <div className="sm:hidden">
          <span className="inline-flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg">
            {currentPage} of {totalPages}
          </span>
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center px-4 py-3 text-base font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* Results Info - Centered Below */}
      {showResultsInfo && (
        <div className="text-center">
          <div className="text-sm text-gray-600">
            <span className="hidden sm:inline">
              Showing <span className="font-medium">{startResult}</span> to <span className="font-medium">{endResult}</span> of{' '}
              <span className="font-medium">{totalResults}</span> results
            </span>
            <span className="sm:hidden">
              {startResult}-{endResult} of {totalResults}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination;