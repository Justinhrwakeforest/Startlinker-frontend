import React from 'react';

const FilterChips = ({ filters, onRemoveFilter, onClearAll, filterLabels = {} }) => {
  // Convert filters to display chips
  const getFilterChips = () => {
    const chips = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        const label = filterLabels[key] || key;
        
        if (Array.isArray(value)) {
          value.forEach(v => {
            chips.push({
              key: `${key}-${v}`,
              label: `${label}: ${v}`,
              onRemove: () => {
                const newValue = value.filter(item => item !== v);
                if (newValue.length === 0) {
                  onRemoveFilter(key);
                } else {
                  onRemoveFilter(key, newValue);
                }
              }
            });
          });
        } else {
          let displayValue = value;
          
          // Special formatting for common filter types
          if (key === 'min_employees') {
            displayValue = `${value}+ employees`;
          } else if (key === 'max_employees') {
            displayValue = `≤${value} employees`;
          } else if (key === 'min_rating') {
            displayValue = `${value}+ stars`;
          } else if (key === 'is_remote' && value === 'true') {
            displayValue = 'Remote only';
          } else if (key === 'is_urgent' && value === 'true') {
            displayValue = 'Urgent jobs';
          } else if (key === 'has_funding' && value === 'true') {
            displayValue = 'Has funding';
          } else if (key === 'posted_since') {
            displayValue = `Posted within ${value} days`;
          }
          
          chips.push({
            key,
            label: `${label}: ${displayValue}`,
            onRemove: () => onRemoveFilter(key)
          });
        }
      }
    });
    
    return chips;
  };

  const chips = getFilterChips();

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Active filters:</span>
      
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      
      <button
        onClick={onClearAll}
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-200 focus:outline-none"
      >
        Clear all
        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default FilterChips;