'use client';

import { create } from 'zustand';
import type { Dream, WeeklyReport } from '@prisma/client';
import type { CurrentUserInfo } from '@/app/actions';

interface AppState {
  // User data
  currentUser: CurrentUserInfo;
  remainingAnalyses: number;
  
  // Dreams data
  dreams: Dream[];
  weeklyReports: WeeklyReport[];
  
  // Loading state
  isInitialLoadComplete: boolean;
  lastFetchTime: number | null;
  
  // Actions
  setCurrentUser: (user: CurrentUserInfo) => void;
  setRemainingAnalyses: (count: number) => void;
  setDreams: (dreams: Dream[]) => void;
  setWeeklyReports: (reports: WeeklyReport[]) => void;
  markInitialLoadComplete: () => void;
  
  // Check if data needs refresh (stale after 5 minutes)
  isDataStale: () => boolean;
  
  // Clear all data (for logout)
  clearAll: () => void;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: null,
  remainingAnalyses: 20,
  dreams: [],
  weeklyReports: [],
  isInitialLoadComplete: false,
  lastFetchTime: null,
  
  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setRemainingAnalyses: (count) => set({ remainingAnalyses: count }),
  setDreams: (dreams) => set({ dreams }),
  setWeeklyReports: (reports) => set({ weeklyReports: reports }),
  
  markInitialLoadComplete: () => set({ 
    isInitialLoadComplete: true,
    lastFetchTime: Date.now()
  }),
  
  isDataStale: () => {
    const { lastFetchTime, isInitialLoadComplete } = get();
    if (!isInitialLoadComplete || !lastFetchTime) return true;
    return Date.now() - lastFetchTime > CACHE_DURATION;
  },
  
  clearAll: () => set({
    currentUser: null,
    remainingAnalyses: 20,
    dreams: [],
    weeklyReports: [],
    isInitialLoadComplete: false,
    lastFetchTime: null,
  }),
}));


