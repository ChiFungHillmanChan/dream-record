'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextType {
  isPageReady: boolean;
  setPageReady: () => void;
  resetLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isPageReady, setIsPageReady] = useState(false);

  const setPageReady = useCallback(() => {
    setIsPageReady(true);
  }, []);

  const resetLoading = useCallback(() => {
    setIsPageReady(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isPageReady, setPageReady, resetLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
