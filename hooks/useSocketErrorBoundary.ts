'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SocketErrorType } from './useGameSocket';

interface SocketError {
  type: SocketErrorType;
  message: string;
  timestamp: number;
  retryCount: number;
}

interface UseSocketErrorBoundaryReturn {
  error: SocketError | null;
  setError: (type: SocketErrorType, message: string) => void;
  clearError: () => void;
  incrementRetry: () => void;
  shouldRetry: boolean;
  errorHandler: {
    onError: (type: SocketErrorType, message: string) => void;
    onReconnect: () => void;
  };
}

const MAX_RETRIES = 3;

export function useSocketErrorBoundary(): UseSocketErrorBoundaryReturn {
  const [error, setErrorState] = useState<SocketError | null>(null);

  const setError = useCallback((type: SocketErrorType, message: string) => {
    setErrorState((prev) => ({
      type,
      message,
      timestamp: Date.now(),
      retryCount: prev?.type === type ? prev.retryCount : 0,
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const incrementRetry = useCallback(() => {
    setErrorState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        retryCount: prev.retryCount + 1,
      };
    });
  }, []);

  const shouldRetry = error ? error.retryCount < MAX_RETRIES : false;

  // Create stable error handler object for useGameSocket
  const errorHandler = useMemo(
    () => ({
      onError: setError,
      onReconnect: clearError,
    }),
    [setError, clearError],
  );

  return {
    error,
    setError,
    clearError,
    incrementRetry,
    shouldRetry,
    errorHandler,
  };
}

export type { SocketError, SocketErrorType };
