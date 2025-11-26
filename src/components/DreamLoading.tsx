'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';

export function DreamLoading() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = [
    "正在連結靈魂深處...",
    "解讀天機符號...",
    "感應情緒脈絡...",
    "聆聽潛意識的低語...",
    "揭示命運的啟示..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050511]/95"
    >
      {/* Optimized Background - using CSS gradients instead of blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, transparent 70%)',
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Main Animation - CSS-based for better mobile performance */}
      <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
        {/* Outer Ring - CSS Animation */}
        <div 
          className="absolute inset-0 rounded-full border border-purple-500/40 border-t-purple-400 animate-spin-slow"
          style={{ willChange: 'transform' }}
        />
        
        {/* Middle Ring - CSS Animation (reverse) */}
        <div 
          className="absolute inset-2 rounded-full border border-blue-500/40 border-b-blue-400 animate-spin-reverse"
          style={{ willChange: 'transform' }}
        />

        {/* Inner Orb - CSS pulse animation */}
        <div 
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden animate-pulse-gentle"
          style={{ 
            boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            willChange: 'transform',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
          <Moon 
            className="text-white/90 relative z-10" 
            size={32} 
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }}
          />
        </div>

        {/* Orbiting Dot - CSS Animation */}
        <div 
          className="absolute inset-[-16px] animate-orbit"
          style={{ willChange: 'transform' }}
        >
          <div 
            className="w-3 h-3 bg-yellow-200 rounded-full absolute top-0 left-1/2 -translate-x-1/2"
            style={{ boxShadow: '0 0 8px rgba(253,224,71,0.7)' }}
          />
        </div>
      </div>

      {/* Text Animation - Minimal motion for smoothness */}
      <div className="relative z-10 h-8 overflow-hidden text-center">
        <motion.p 
          key={messageIndex}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-base md:text-lg font-medium text-purple-200 tracking-widest"
        >
          {messages[messageIndex]}
        </motion.p>
      </div>
      
      {/* Progress bar - CSS animation */}
      <div className="w-48 h-0.5 bg-white/10 rounded-full mt-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500/50 via-purple-500 to-purple-500/50 animate-progress-bar"
          style={{ willChange: 'transform' }}
        />
      </div>

      {/* CSS Animations - defined inline for better tree-shaking */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes progress-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 10s linear infinite;
        }
        .animate-orbit {
          animation: orbit 6s linear infinite;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2.5s ease-in-out infinite;
        }
        .animate-progress-bar {
          animation: progress-bar 2s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
}
