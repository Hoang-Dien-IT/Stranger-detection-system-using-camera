import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce Hook - Debounce a value with configurable delay
 * Perfect for search inputs, API calls, and form validation in Face Recognition SaaS
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook - Debounce a callback function
 * Useful for API calls, form submissions, and expensive operations
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef<T>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, cancel];
}

/**
 * useSearchDebounce Hook - Specialized debounce for search functionality
 * Optimized for Face Recognition search features (cameras, persons, detections)
 */
export function useSearchDebounce(
  initialValue: string = '',
  delay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update searching state
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  const cancelSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    cancelSearch
  };
}

/**
 * useFormDebounce Hook - Debounce form validation and submission
 * Perfect for real-time form validation in Face Recognition settings
 */
export function useFormDebounce<T extends Record<string, any>>(
  initialValues: T,
  validationFn?: (values: T) => Record<string, string>,
  delay: number = 500
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const debouncedValues = useDebounce(values, delay);

  // Run validation on debounced values
  useEffect(() => {
    if (validationFn && Object.keys(values).length > 0) {
      setIsValidating(true);
      
      const validationErrors = validationFn(debouncedValues);
      setErrors(validationErrors);
      setIsValidating(false);
    }
  }, [debouncedValues, validationFn, values]);

  const updateValue = useCallback((key: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValidating(false);
  }, [initialValues]);

  const hasErrors = Object.keys(errors).length > 0;
  const isValid = !hasErrors && !isValidating;

  return {
    values,
    debouncedValues,
    errors,
    isValidating,
    hasErrors,
    isValid,
    updateValue,
    updateValues,
    resetForm
  };
}

/**
 * useApiDebounce Hook - Debounce API calls with loading state
 * Optimized for Face Recognition API operations
 */
export function useApiDebounce<T, P extends any[]>(
  apiFunction: (...params: P) => Promise<T>,
  delay: number = 300
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
//   const timeoutRef = useRef<NodeJS.Timeout>();
  const cancelTokenRef = useRef<AbortController | undefined>(undefined);

  const [debouncedCall, cancelCall] = useDebouncedCallback(
    async (...params: P) => {
      try {
        setIsLoading(true);
        setError(null);

        // Cancel previous request
        if (cancelTokenRef.current) {
          cancelTokenRef.current.abort();
        }

        // Create new cancel token
        cancelTokenRef.current = new AbortController();

        const result = await apiFunction(...params);
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    delay
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    cancelCall();
  }, [cancelCall]);

  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.abort();
      }
    };
  }, []);

  return {
    call: debouncedCall,
    cancel: cancelCall,
    reset,
    isLoading,
    data,
    error
  };
}

/**
 * useFilterDebounce Hook - Debounce filter operations
 * Perfect for Face Recognition detection filters, camera filters, etc.
 */
export function useFilterDebounce<T extends Record<string, any>>(
  initialFilters: T,
  delay: number = 400
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [isFiltering, setIsFiltering] = useState(false);
  const debouncedFilters = useDebounce(filters, delay);

  // Track filtering state
  useEffect(() => {
    const hasChanges = JSON.stringify(filters) !== JSON.stringify(debouncedFilters);
    setIsFiltering(hasChanges);
  }, [filters, debouncedFilters]);

  const updateFilter = useCallback((key: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback((key: keyof T) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const hasActiveFilters = useCallback(() => {
    return Object.values(debouncedFilters).some(value => 
      value !== null && value !== undefined && value !== ''
    );
  }, [debouncedFilters]);

  return {
    filters,
    debouncedFilters,
    isFiltering,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters: hasActiveFilters()
  };
}

/**
 * useResizeDebounce Hook - Debounce window resize events
 * Useful for responsive Face Recognition video streams and charts
 */
export function useResizeDebounce(delay: number = 250) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const debouncedSize = useDebounce(windowSize, delay);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    windowSize: debouncedSize,
    isResizing: JSON.stringify(windowSize) !== JSON.stringify(debouncedSize)
  };
}

// Export default useDebounce for backward compatibility
export default useDebounce;
