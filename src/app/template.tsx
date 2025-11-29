'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { DreamLoading } from '@/components/DreamLoading';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingProvider, useLoading } from '@/lib/loading-context';
import { useAppStore } from '@/lib/app-store';

const LOADING_MESSAGES: Record<string, string[]> = {
  '/': [
    "正在開啟夢境日記...",
    "準備記錄您的夢境...",
    "連結潛意識檔案..."
  ],
  '/login': [
    "正在開啟夢境大門...",
    "驗證靈魂頻率...",
    "準備進入..."
  ],
  '/register': [
    "正在鑄造夢境鑰匙...",
    "建立靈魂檔案...",
    "準備開始旅程..."
  ],
  '/settings': [
    "正在調整夢境頻率...",
    "更新靈魂參數...",
    "儲存偏好設定..."
  ],
  '/admin': [
    "正在進入管理者領域...",
    "讀取全知視野...",
    "系統校準中..."
  ],
  '/weekly-reports': [
    "正在彙整夢境碎片...",
    "分析週期波動...",
    "需要多啲時間，請耐心等待...",
    "生成週報圖表..."
  ]
};

const DEFAULT_MESSAGES = [
  "正在連結靈魂深處...",
  "解讀天機符號...",
  "感應情緒脈絡...",
  "聆聽潛意識的低語...",
  "揭示命運的啟示..."
];

// Pages that can use cached client-side data (skip loading screen if cached)
// Note: Server-rendered pages like /weekly-reports, /admin should NOT be here
// because they fetch fresh data on the server each time
const CACHED_PAGES = ['/', '/settings'];

// Maximum loading time before auto-dismiss (safety fallback)
const MAX_LOADING_TIME = 8000;
// Minimum loading time for smooth transition (only on first load)
const MIN_LOADING_TIME_FIRST = 800;
// Quick transition for cached data
const MIN_LOADING_TIME_CACHED = 200;

function TemplateContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isPageReady, resetLoading } = useLoading();
  const { isInitialLoadComplete, isDataStale } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Check if this is a page that can use cached data
  const canUseCachedData = CACHED_PAGES.some(p => 
    p === pathname || (p !== '/' && pathname.startsWith(p))
  );
  
  // Skip loading screen if we have cached data and it's not stale
  const hasCachedData = isInitialLoadComplete && !isDataStale() && canUseCachedData;
  
  // Determine if we should show loading
  const showLoading = isLoading && !hasCachedData && (!isPageReady || !minTimeElapsed);

  const finishLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // If we have cached data, skip loading immediately
    if (hasCachedData) {
      setIsLoading(false);
      return;
    }
    
    // Determine messages based on path
    let currentMessages = DEFAULT_MESSAGES;
    
    // Exact match
    if (LOADING_MESSAGES[pathname]) {
      currentMessages = LOADING_MESSAGES[pathname];
    } else {
      // Partial match (e.g. /analysis/123)
      const key = Object.keys(LOADING_MESSAGES).find(key => 
        key !== '/' && pathname.startsWith(key)
      );
      if (key) {
        currentMessages = LOADING_MESSAGES[key];
      } else if (pathname.startsWith('/analysis/')) {
        currentMessages = [
          "正在準備分析報告...",
          "讀取夢境解析...",
          "呈現潛意識洞察..."
        ];
      }
    }
    
    setMessages(currentMessages);
    setIsLoading(true);
    setMinTimeElapsed(false);
    resetLoading();

    // Use shorter minimum time if we already have some cached data
    const minLoadingTime = isInitialLoadComplete ? MIN_LOADING_TIME_CACHED : MIN_LOADING_TIME_FIRST;

    // Minimum loading time for smooth visual transition
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minLoadingTime);

    // Maximum loading time (safety fallback)
    const maxTimer = setTimeout(() => {
      finishLoading();
    }, MAX_LOADING_TIME);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [pathname, resetLoading, finishLoading, hasCachedData, isInitialLoadComplete]);

  // When page is ready and minimum time has elapsed, finish loading
  useEffect(() => {
    if (isPageReady && minTimeElapsed) {
      finishLoading();
    }
  }, [isPageReady, minTimeElapsed, finishLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoading && <DreamLoading key="loader" messages={messages} />}
      </AnimatePresence>
      <motion.div
        key={pathname}
        initial={{ opacity: hasCachedData ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: hasCachedData ? 0.15 : 0.5, delay: hasCachedData ? 0 : 0.2 }}
      >
        {children}
      </motion.div>
    </>
  );
}

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <TemplateContent>{children}</TemplateContent>
    </LoadingProvider>
  );
}
