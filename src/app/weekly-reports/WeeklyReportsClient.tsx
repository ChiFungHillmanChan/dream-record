'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWeeklyReport, WeeklyReportData, WeeklyReportStatus } from '@/app/actions';
import { PLANS } from '@/lib/constants';
import { Loader2, Lock, Sparkles, ArrowLeft, Calendar, Brain, Heart, Zap, Crown, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Temporary type until Prisma client is fully updated and types are shared
type WeeklyReport = {
  id: string;
  startDate: Date;
  endDate: Date;
  analysis: string;
  imageBase64: string | null;
  createdAt: Date;
};

interface WeeklyReportsClientProps {
  initialReports: WeeklyReport[];
  userPlan: string;
  reportStatus: WeeklyReportStatus | null;
}

export default function WeeklyReportsClient({ initialReports, userPlan, reportStatus }: WeeklyReportsClientProps) {
  const [reports] = useState<WeeklyReport[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateWeeklyReport();
      if (result.success) {
        window.location.reload(); // Simple reload to fetch new data
      } else {
        setError(result.error || '生成失敗');
      }
    } catch {
      setError('發生錯誤');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFree = userPlan === PLANS.FREE;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-purple-500/30">
      {/* Background Gradient Animation */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <Link href="/" className="flex items-center text-neutral-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 mr-1 md:mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden md:inline">返回日記</span>
          </Link>
          <h1 className="text-lg md:text-xl font-light tracking-widest uppercase text-purple-400/80">夢境週報</h1>
        </header>

        <AnimatePresence mode="wait">
          {selectedReport ? (
            <ReportView 
              key="report-view"
              report={selectedReport} 
              isFree={isFree} 
              onBack={() => setSelectedReport(null)} 
            />
          ) : (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex flex-col items-center justify-center mb-16 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                  探索你的潛意識週期
                </h2>
                <p className="text-neutral-400 max-w-xl mb-8 leading-relaxed">
                  每週日，我們將你過去七天的夢境編織成一個故事，揭示隱藏的情緒軌跡與心理原型。
                </p>

                {/* Weekly Report Status */}
                {reportStatus && (
                  <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl max-w-md w-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-neutral-400">本週週報</span>
                      <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                        {new Date(reportStatus.weekStartDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - {new Date(reportStatus.weekEndDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-left">
                        <div className="text-xs text-neutral-500 mb-1">已生成 / 上限</div>
                        <div className="text-lg font-bold text-white">
                          {reportStatus.reportsUsed} / {reportStatus.reportsLimit}
                          {reportStatus.isPremium && <Crown className="inline w-4 h-4 ml-1 text-amber-400" />}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-neutral-500 mb-1">記錄天數 / 需求</div>
                        <div className={`text-lg font-bold ${reportStatus.daysRecorded >= reportStatus.daysRequired ? 'text-green-400' : 'text-amber-400'}`}>
                          {reportStatus.daysRecorded} / {reportStatus.daysRequired} 天
                        </div>
                      </div>
                    </div>

                    {!reportStatus.canGenerate && (
                      <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 p-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {reportStatus.reportsUsed >= reportStatus.reportsLimit 
                            ? '本週週報配額已用完' 
                            : `還需要 ${reportStatus.daysRequired - reportStatus.daysRecorded} 天的夢境記錄`}
                          {!reportStatus.isPremium && reportStatus.daysRecorded < reportStatus.daysRequired && (
                            <Link href="/settings" className="ml-1 text-purple-400 hover:underline">
                              升級深度版只需 3 天
                            </Link>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (reportStatus && !reportStatus.canGenerate)}
                  className="relative group px-8 py-4 bg-white text-black rounded-full font-medium text-lg hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        正在分析夢境...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        生成本週報告
                        {reportStatus && (
                          <span className="ml-2 text-sm opacity-60">
                            ({reportStatus.reportsLimit - reportStatus.reportsUsed} 次剩餘)
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[length:200%_100%] animate-gradient" />
                </button>
                {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {reports.map((report, idx) => {
                  const data = JSON.parse(report.analysis) as WeeklyReportData;
                  const startDate = new Date(report.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                  const endDate = new Date(report.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                  
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedReport(report)}
                      className="group relative bg-neutral-900/50 border border-white/10 hover:border-purple-500/50 rounded-2xl p-6 cursor-pointer hover:bg-neutral-800/50 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20">
                            {startDate} - {endDate}
                          </span>
                          <Calendar className="w-4 h-4 text-neutral-500" />
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-300 transition-colors">
                          {data.word_of_the_week}
                        </h3>
                        
                        <p className="text-neutral-400 text-sm line-clamp-2 mb-4">
                          {data.summary}
                        </p>

                        <div className="flex items-center text-xs text-neutral-500 space-x-4">
                          <div className="flex items-center">
                            <Brain className="w-3 h-3 mr-1" />
                            {data.themes.length} Themes
                          </div>
                          <div className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {data.archetypes.length} Archetypes
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {reports.length === 0 && !isGenerating && (
                <div className="text-center text-neutral-600 mt-12">
                  <p>尚無週報。試著記錄更多夢境來解鎖分析。</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReportView({ report, isFree, onBack }: { report: WeeklyReport, isFree: boolean, onBack: () => void }) {
  const data = JSON.parse(report.analysis) as WeeklyReportData;
  const startDate = new Date(report.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  const endDate = new Date(report.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
    >
      {/* Header / Cover */}
      <div className="relative h-64 md:h-80 w-full bg-neutral-800 overflow-hidden">
        {report.imageBase64 ? (
            // Using standard img tag as per rules for base64 data URI which is external-ish (not in public folder)
            // Although base64 is technically internal data, standard img works well here.
            <img 
                src={`data:image/png;base64,${report.imageBase64}`} 
                alt="Dream Collage" 
                className="w-full h-full object-cover"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                <Sparkles className="w-12 h-12 text-white/20" />
            </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center justify-between">
                <button 
                    onClick={onBack}
                    className="p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors text-white mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-mono text-white/60 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                    {startDate} - {endDate}
                </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-2">{data.word_of_the_week}</h2>
            <p className="text-lg text-white/80 italic">{data.emotional_trajectory}</p>
        </div>
      </div>

      <div className="p-6 md:p-10 space-y-12">
        {/* Summary Section */}
        <section>
            <h3 className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-4">Executive Summary</h3>
            <p className="text-xl leading-relaxed text-neutral-200">
                {data.summary}
            </p>
        </section>

        {/* Emotional Curve & Day Residue */}
        <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-4 flex items-center">
                    <Zap className="w-4 h-4 mr-2" /> Day Residue Filter
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                    {data.day_residue_analysis}
                </p>
            </section>
            <section className="bg-white/5 p-6 rounded-2xl border border-white/5">
                 <h3 className="text-xs font-bold tracking-widest text-pink-400 uppercase mb-4 flex items-center">
                    <Heart className="w-4 h-4 mr-2" /> Emotional Arc
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                    {data.emotional_trajectory}
                </p>
            </section>
        </div>

        {/* Themes - PREMIUM */}
        <section className="relative">
            <h3 className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-6 flex items-center">
                <Brain className="w-4 h-4 mr-2" /> Recurrent Themes
            </h3>
            
            <div className="grid gap-4">
                {data.themes.map((theme, i) => (
                    <div key={i} className={`p-5 rounded-xl bg-neutral-800/50 border border-white/5 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                        <h4 className="text-lg font-semibold text-white mb-2">{theme.name}</h4>
                        <p className="text-neutral-400">{theme.description}</p>
                    </div>
                ))}
            </div>
            
            {isFree && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <UnlockPrompt />
                </div>
            )}
        </section>

        {/* Archetypes - PREMIUM */}
        <section className="relative">
             <h3 className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-6">Jungian Archetypes</h3>
             <div className="grid md:grid-cols-2 gap-4">
                {data.archetypes.map((arch, i) => (
                    <div key={i} className={`p-5 rounded-xl bg-neutral-800/50 border border-white/5 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                        <h4 className="text-lg font-semibold text-amber-200 mb-2">{arch.name}</h4>
                        <p className="text-neutral-400">{arch.explanation}</p>
                    </div>
                ))}
             </div>
             {isFree && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                     {/* Reuse unlock prompt or just rely on the first one if they overlap in view, but separate sections is better */}
                </div>
            )}
        </section>

        {/* Actionable Advice - PREMIUM */}
        <section className="relative bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-3xl border border-white/10 overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-xs font-bold tracking-widest text-white/60 uppercase mb-4">Weekly Action Item</h3>
                <div className={isFree ? 'blur-md select-none opacity-50' : ''}>
                    <p className="text-2xl font-serif italic text-white mb-6">&quot;{data.advice}&quot;</p>
                    <div className="bg-white/10 p-4 rounded-xl inline-block">
                        <p className="text-sm text-purple-200 font-semibold">Reflection Question</p>
                        <p className="text-white mt-1">{data.reflection_question}</p>
                    </div>
                </div>
             </div>
             
             {isFree && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-[2px]">
                    <UnlockPrompt />
                </div>
            )}
        </section>
      </div>
    </motion.div>
  );
}

function UnlockPrompt() {
    return (
        <div className="text-center p-6 bg-black/80 border border-purple-500/50 rounded-2xl shadow-2xl backdrop-blur-xl max-w-sm">
            <Lock className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-white mb-2">Unlock Deep Insights</h4>
            <p className="text-neutral-400 text-sm mb-6">
                Upgrade to Deep Plan to reveal Archetypes, Actionable Advice, and Hidden Themes.
            </p>
            <Link href="/settings" className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-medium transition-colors">
                Upgrade Now
            </Link>
        </div>
    );
}

