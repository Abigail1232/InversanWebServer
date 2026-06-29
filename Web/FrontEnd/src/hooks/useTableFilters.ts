import { useState, useEffect } from 'react';

export function useTableFilters<T extends Record<string, any>>(initialState: T, delay = 500) {
  const [filters, setFilters] = useState<T>(initialState);
  const [debouncedFilters, setDebouncedFilters] = useState<T>(initialState);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [filters, delay]);

  const updateFilter = (key: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialState);
  };

  // Only count explicitly set values matching our specs as active
  const activeCount = Object.keys(filters).filter(k => 
    filters[k] !== undefined && 
    filters[k] !== '' && 
    filters[k] !== initialState[k] // ignore initialized fixed boundaries like dias=30 if any
  ).length;

  return {
    filters,
    debouncedFilters,
    updateFilter,
    clearFilters,
    activeCount
  };
}
