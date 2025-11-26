'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, Moon, Cloud, Star } from 'lucide-react';

export function DreamLoading() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "正在連結潛意識...",
    "解讀夢境符號...",
    "分析情緒脈絡...",
    "探索隱藏的訊息...",
    "編織解析結果..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050511]/90 backdrop-blur-md"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Animation */}
      <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-purple-500/30 border-t-purple-400 border-r-transparent"
        />
        
        {/* Middle Ring */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-blue-500/30 border-b-blue-400 border-l-transparent"
        />

        {/* Inner Orb */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_40px_rgba(124,58,237,0.5)] flex items-center justify-center relative overflow-hidden"
        >
            <motion.div 
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20"
            />
            <Moon className="text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" size={40} />
        </motion.div>

        {/* Orbiting Star */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-20px]"
        >
          <div className="w-4 h-4 bg-yellow-200 rounded-full blur-[2px] shadow-[0_0_10px_rgba(253,224,71,0.8)] absolute top-0 left-1/2 -translate-x-1/2" />
        </motion.div>
      </div>

      {/* Text Animation */}
      <div className="relative z-10 h-8 overflow-hidden text-center">
        <motion.p 
          key={messageIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-lg md:text-xl font-medium text-purple-200 tracking-widest"
        >
          {messages[messageIndex]}
        </motion.p>
      </div>
      
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ duration: 10, repeat: Infinity }}
        className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-4"
      />

    </motion.div>
  );
}




