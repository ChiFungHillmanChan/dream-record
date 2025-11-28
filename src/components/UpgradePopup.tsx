'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, Star, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  isTrialUpgrade: boolean;
  trialDaysRemaining: number | null;
}

// Floating particle component for magical effect
const FloatingParticle = ({ delay, duration, size }: { delay: number; duration: number; size: number }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, rgba(167,139,250,0.8) 0%, rgba(251,191,36,0.6) 50%, transparent 100%)`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
      y: [-20, -60],
      x: [0, (Math.random() - 0.5) * 40],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
    }}
  />
);

// Star burst animation
const StarBurst = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
        }}
        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
        animate={{
          opacity: [1, 0],
          scale: [0, 1],
          x: Math.cos((i * 360) / 20 * Math.PI / 180) * 200,
          y: Math.sin((i * 360) / 20 * Math.PI / 180) * 200,
        }}
        transition={{
          duration: 1.5,
          delay: 0.1,
          ease: 'easeOut',
        }}
      >
        <Star size={12} className="text-amber-400 fill-amber-400" />
      </motion.div>
    ))}
  </motion.div>
);

export function UpgradePopup({ isOpen, onClose, isTrialUpgrade, trialDaysRemaining }: UpgradePopupProps) {
  const [showStarBurst, setShowStarBurst] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger star burst animation on open
      setTimeout(() => setShowStarBurst(true), 300);
    } else {
      setShowStarBurst(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          onClick={onClose}
        >
          {/* Background magical particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <FloatingParticle
                key={i}
                delay={i * 0.2}
                duration={3 + Math.random() * 2}
                size={4 + Math.random() * 8}
              />
            ))}
          </div>

          {/* Star burst effect */}
          {showStarBurst && <StarBurst />}

          {/* Main popup container */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              delay: 0.1,
            }}
            className="relative w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 rounded-3xl opacity-75 blur-lg animate-pulse" />

            {/* Main card */}
            <div className="relative bg-gradient-to-br from-[#1e1b4b] via-[#1a1d3d] to-[#0f1230] rounded-3xl border border-purple-500/30 shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-10"
              >
                <X size={18} />
              </button>

              {/* Crown icon with glow */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotateZ: [-3, 3, -3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-5 rounded-full shadow-lg shadow-amber-500/50">
                    <Crown size={40} className="text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="pt-16 px-8 pb-8 text-center">
                {/* Animated sparkles */}
                <motion.div
                  className="flex justify-center gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.15,
                        repeat: Infinity,
                      }}
                    >
                      <Sparkles size={16} className="text-amber-400" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Main title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black bg-gradient-to-r from-amber-200 via-purple-200 to-amber-200 bg-clip-text text-transparent mb-2"
                >
                  🎉 恭喜你！
                </motion.h2>

                {isTrialUpgrade ? (
                  // Admin trial upgrade message
                  <>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl font-bold text-purple-200 mb-4"
                    >
                      管理員已為你開通深度版試用！
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 mb-6 border border-purple-500/20"
                    >
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Zap size={24} className="text-amber-400" />
                        <span className="text-4xl font-black text-amber-300">
                          {trialDaysRemaining ?? 0}
                        </span>
                        <span className="text-xl text-purple-200">日試用</span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        盡情探索深度版所有功能！
                      </p>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-slate-400 text-sm mb-6"
                    >
                      試用期內可享用無限次 AI 夢境解析同每週報告。<br />
                      如果鍾意嘅話，記得訂閱續享呀！✨
                    </motion.p>
                  </>
                ) : (
                  // Self-upgraded message
                  <>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl font-bold text-purple-200 mb-4"
                    >
                      你已成功升級至深度版！
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-3 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-5 mb-6 border border-purple-500/20"
                    >
                      <h3 className="text-purple-200 font-bold text-lg flex items-center justify-center gap-2">
                        <Star size={18} className="text-amber-400 fill-amber-400" />
                        深度版專屬功能
                      </h3>
                      <ul className="text-left text-slate-300 text-sm space-y-2 pl-4">
                        <li className="flex items-start gap-2">
                          <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-purple-200">無限次</strong> AI 夢境深度解析</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span><strong className="text-purple-200">每週</strong>生成專屬夢境週報</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>解鎖<strong className="text-purple-200">完整</strong>心理分析同反思問題</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <span>專屬<strong className="text-purple-200">夢境藝術圖像</strong>生成</span>
                        </li>
                      </ul>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-slate-400 text-sm mb-6"
                    >
                      多謝你嘅支持！<br />
                      從今日起，解鎖更深層次嘅夢境探索之旅 🌙
                    </motion.p>
                  </>
                )}

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-3"
                >
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    開始探索 ✨
                  </button>

                  {isTrialUpgrade && (
                    <Link
                      href="/settings"
                      onClick={onClose}
                      className="w-full py-3 rounded-xl border border-purple-500/30 text-purple-300 font-medium text-sm hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Crown size={16} className="text-amber-400" />
                      睇吓訂閱計劃
                    </Link>
                  )}
                </motion.div>
              </div>

              {/* Bottom decorative glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-t from-purple-500/20 to-transparent blur-2xl pointer-events-none" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

