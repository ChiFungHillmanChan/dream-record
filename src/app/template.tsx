'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DreamLoading } from '@/components/DreamLoading';
import { LoadingProvider, useLoading } from '@/lib/loading-context';

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
  "感應情緒脈絡..."
];

function TemplateContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isPageReady, resetLoading } = useLoading();
  const [showLoading, setShowLoading] = useState(true);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);

  // Reset loading state when pathname changes
  useEffect(() => {
    // Get messages for this path
    let currentMessages = DEFAULT_MESSAGES;
    if (LOADING_MESSAGES[pathname]) {
      currentMessages = LOADING_MESSAGES[pathname];
    } else if (pathname.startsWith('/analysis/')) {
      currentMessages = [
        "正在準備分析報告...",
        "讀取夢境解析...",
        "呈現潛意識洞察..."
      ];
    }
    
    setMessages(currentMessages);
    setShowLoading(true);
    resetLoading();
    
    // Safety timeout - max 10 seconds loading
    const safetyTimer = setTimeout(() => {
      setShowLoading(false);
    }, 10000);
    
    return () => clearTimeout(safetyTimer);
  }, [pathname, resetLoading]);

  // When page signals ready, hide loading
  useEffect(() => {
    if (isPageReady) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPageReady]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999]"
          >
            <DreamLoading messages={messages} />
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ visibility: showLoading ? 'hidden' : 'visible' }}>
        {children}
      </div>
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
