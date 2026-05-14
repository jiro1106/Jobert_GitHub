/**
 * Custom React Hook for API calls
 * Provides a clean interface for handling loading, error, and data states
 */

import { useState, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: () => Promise<T>;
  reset: () => void;
}

/**
 * Custom hook for handling async API calls
 * @param asyncFunction - The async function to execute
 * @returns Object with data, loading, error, execute, and reset
 */
export function useApi<T>(
  asyncFunction: () => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
