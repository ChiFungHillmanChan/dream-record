'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DreamLoading } from '@/components/DreamLoading';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);

  useEffect(() => {
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

    // Short loading duration to ensure smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <DreamLoading key="loader" messages={messages} />}
      </AnimatePresence>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </>
  );
}

