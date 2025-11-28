'use client';

import { DreamAnalysisResult } from '@/app/actions';
import { motion } from 'framer-motion';
import { Sparkles, Wind, Lightbulb, Quote, Heart, Lock } from 'lucide-react';
import Link from 'next/link';

interface DreamResultProps {
  result: DreamAnalysisResult;
}

export function DreamResult({ result }: DreamResultProps) {
  // Handle both array format (new) and string format (legacy/fallback)
  const getAnalysisPoints = () => {
    if (!result.analysis) return [];
    
    if (Array.isArray(result.analysis)) {
      return result.analysis;
    }

    // Fallback for legacy string format
    if (typeof result.analysis === 'string') {
      const text = result.analysis as string;
      const parts = text.split(/\n(?=\d+\.)/g);
      return parts.map(part => {
        const match = part.match(/^(\d+\.)\s*([\s\S]+)/);
        if (match) {
            const content = match[2];
            const titleMatch = content.match(/^\*\*(.*?)\*\*:?\s*([\s\S]*)/);
            if (titleMatch) {
              return { title: titleMatch[1], content: titleMatch[2] };
            }
            return { title: null, content: content };
        }
        return { title: null, content: part.trim() };
      }).filter(p => p.content);
    }

    return [];
  };

  const analysisPoints = getAnalysisPoints();

  // Staggered animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full space-y-6 mt-6"
    >
      {/* Header Card - Warm & Dreamy */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2e1065] to-[#4c1d95] border border-orange-300/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-20 text-orange-300">
          <Sparkles size={100} />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-rose-200 mb-6 flex items-center gap-2">
            <Sparkles className="text-orange-300" /> 天機解讀報告
          </h2>
          
          {/* Summary Box */}
          <div className="bg-white/10 rounded-xl p-5 border border-white/10 backdrop-blur-sm mb-4">
             <h3 className="text-sm font-bold text-orange-200 mb-2 flex items-center gap-2 uppercase tracking-wider">
                <Quote size={14} /> 夢境殘片
             </h3>
             <p className="text-lg text-indigo-50 leading-relaxed font-medium">
               {result.summary}
             </p>
          </div>

          {/* Vibe Tag */}
          <div className="inline-flex items-start sm:items-center gap-2 sm:gap-3 bg-black/20 rounded-xl sm:rounded-full px-4 py-3 sm:py-2 border border-white/10">
             <Wind size={16} className="text-indigo-300 flex-shrink-0 mt-0.5 sm:mt-0" />
             <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
               <span className="text-indigo-200 text-xs sm:text-sm whitespace-nowrap">整體氛圍：</span>
               <span className="text-white font-bold text-sm sm:text-base">{result.vibe}</span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Deep Analysis Section */}
      {result.analysis ? (
        <div className="space-y-4">
           <motion.h3 variants={item} className="text-lg font-bold text-indigo-200 pl-3 border-l-4 border-orange-400 flex items-center gap-2">
              <Lightbulb size={20} className="text-orange-400" /> 天機剖析
           </motion.h3>
           
           <div className="grid gap-4">
             {analysisPoints.length > 0 ? (
               analysisPoints.map((point, idx) => (
                 <motion.div 
                   key={idx} 
                   variants={item}
                   className="bg-[#1e1b4b]/60 border border-indigo-500/20 rounded-xl p-5 hover:border-orange-500/30 transition-all hover:bg-[#1e1b4b]/80"
                 >
                   <div className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 text-orange-300 flex items-center justify-center font-bold text-sm border border-orange-500/30">
                        {idx + 1}
                      </span>
                      <div className="space-y-2">
                        {point.title && (
                          <h4 className="font-bold text-orange-100 text-lg">
                            {point.title}
                          </h4>
                        )}
                        <p className="text-indigo-100 leading-7 whitespace-pre-line text-base/loose">
                          {point.content}
                        </p>
                      </div>
                   </div>
                 </motion.div>
               ))
             ) : (
               <motion.div variants={item} className="bg-[#1e1b4b]/60 rounded-xl p-5 text-indigo-100 whitespace-pre-wrap leading-relaxed">
                 {/* Handle string fallback if array is empty but analysis string exists */}
                 {typeof result.analysis === 'string' ? result.analysis : "暫無詳細分析"}
               </motion.div>
             )}
           </div>
        </div>
      ) : (
        <motion.div variants={item} className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-white/10 text-center relative overflow-hidden group cursor-pointer">
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" />
             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
             
             <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-500 mb-2 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                    <Lock size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-200 mb-2">解鎖天機</h3>
                    <p className="text-gray-400 max-w-md mx-auto text-sm">
                        升級到深度版，獲取完整的周公解夢與心理分析，深入探索潛意識的訊息。
                    </p>
                </div>
                <Link href="/settings" className="mt-2 px-8 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full text-white font-bold shadow-lg hover:shadow-orange-500/25 hover:scale-105 transition-all">
                    立即升級
                </Link>
             </div>
        </motion.div>
      )}

      {/* Suggestion Section */}
      {result.reflection && (
        <motion.div variants={item} className="rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-400">
                <Heart size={80} />
            </div>
            <h3 className="text-emerald-300 font-bold mb-4 flex items-center gap-2 text-lg relative z-10">
                <Heart className="text-emerald-400 fill-emerald-400/20" size={20} /> 心靈指引
            </h3>
            <div className="relative z-10">
                <p className="text-emerald-50 whitespace-pre-line leading-relaxed text-base/loose">
                    {result.reflection}
                </p>
            </div>
        </motion.div>
      )}
    </motion.div>
  );
}
