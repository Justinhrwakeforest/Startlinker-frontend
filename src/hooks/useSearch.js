import { useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';

const useSearch = (endpoint, initialFilters = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [totalResults, setTotalResults] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounced search function
  const search = useCallback(
    debounce(async (searchFilters, page = 1, updateType = 'replace') => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value);
            }
          }
        });

        params.append('page', page);
        
        const response = await axios.get(`${endpoint}?${params.toString()}`);
        
        if (page === 1 || updateType === 'replace') {
          setResults(response.data.results || []);
        } else {
          setResults(prev => [...prev, ...(response.data.results || [])]);
        }
        
        setTotalResults(response.data.count || 0);
        setHasNextPage(!!response.data.next);
        setCurrentPage(page);
      } catch (err) {
        console.error('Search error:', err);
        setError(err.response?.data?.message || 'Search failed');
        if (page === 1 || updateType === 'replace') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300),
    [endpoint]
  );

  // Update filters and trigger search
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1);
    search(updatedFilters, 1, 'replace');
  }, [filters, search]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setCurrentPage(1);
    search(initialFilters, 1, 'replace');
  }, [initialFilters, search]);

  // Load more results (pagination)
  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      search(filters, currentPage + 1, 'append');
    }
  }, [filters, currentPage, hasNextPage, loading, search]);

  // Go to specific page
  const goToPage = useCallback((page) => {
    if (page !== currentPage && page >= 1 && !loading) {
      search(filters, page, 'replace');
    }
  }, [filters, currentPage, loading, search]);

  // Remove a specific filter
  const removeFilter = useCallback((filterKey) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Add a method to update results without refetching
  const updateResults = useCallback((updater) => {
    setResults(prev => prev.map(updater));
  }, []);

  // Initial search
  useEffect(() => {
    search(filters, 1, 'replace');
  }, []);

  return {
    results,
    loading,
    error,
    filters,
    totalResults,
    hasNextPage,
    currentPage,
    updateFilters,
    resetFilters,
    removeFilter,
    loadMore,
    goToPage,
    search: (newFilters) => search(newFilters, 1, 'replace'),
    updateResults  // Add this new method
  };
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default useSearch;

