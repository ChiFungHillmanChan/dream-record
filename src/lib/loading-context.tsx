'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingContextType {
  isPageReady: boolean;
  setPageReady: () => void;
  resetLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

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
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

// Hook to automatically set page ready when data is loaded
export function usePageReady(isDataLoaded: boolean) {
  const { setPageReady } = useLoading();
  
  // Call setPageReady when data is loaded
  if (isDataLoaded) {
    setPageReady();
  }
}

