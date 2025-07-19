// hooks/useApi.js - Custom hook for API calls

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API calls with loading, error, and data states
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {boolean} immediate - Whether to call immediately
 * @returns {Object} API state and methods
 */
export const useApi = (url, options = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (overrideOptions = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...overrideOptions.headers,
          },
          ...options,
          ...overrideOptions,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, options]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
  };
};
