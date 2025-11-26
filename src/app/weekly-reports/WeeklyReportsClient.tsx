'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWeeklyReport, WeeklyReportData, WeeklyReportStatus } from '@/app/actions';
import { PLANS } from '@/lib/constants';
import { Loader2, Lock, Sparkles, ArrowLeft, Brain, Heart, Zap, Crown, FileText, ChevronRight, Quote, Fingerprint, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { WeeklyReport } from '@prisma/client';

// Helper for tag colors (reused from main page logic)
const TAG_PALETTE = [
  '#a78bfa', '#22d3ee', '#fb7185', '#34d399', '#fbbf24', 
  '#f472b6', '#60a5fa', '#f87171', '#c084fc', '#2dd4bf'
];

function getTagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) {
    h = (h * 31 + tag.charCodeAt(i)) | 0;
  }
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length];
}

interface WeeklyReportsClientProps {
  initialReports: WeeklyReport[];
  userPlan: string;
  reportStatus: WeeklyReportStatus | null;
}

export default function WeeklyReportsClient({ initialReports, userPlan, reportStatus }: WeeklyReportsClientProps) {
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>(initialReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState('');

  // Update local state when props change (e.g. after router.refresh())
  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateWeeklyReport();
      if (result.success) {
        router.refresh();
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
    <div className="min-h-screen text-slate-200 font-sans selection:bg-purple-500/30 pb-20">
       {/* Background Elements */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1 }}
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <header className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                      週夢解析
                    </h1>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mt-1">
                      潛意識架構
                    </p>
                  </div>
                </div>
              </header>

              {/* Generator Section */}
              <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 mb-16">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />
                   
                   <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          每週洞察
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                          將過去一週的夢境碎片拼湊成完整的潛意識地圖。發現隱藏的模式與情緒軌跡。
                        </p>
                        
                        {reportStatus && (
                           <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
                             <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
                               <span>每週配額</span>
                               <span className={reportStatus.reportsUsed >= reportStatus.reportsLimit ? 'text-amber-400' : 'text-white'}>
                                 {reportStatus.reportsUsed} / {reportStatus.reportsLimit}
                               </span>
                             </div>
                             <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                               <div 
                                 className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                                 style={{ width: `${Math.min(100, (reportStatus.reportsUsed / reportStatus.reportsLimit) * 100)}%` }}
                               />
                             </div>
                             <div className="flex justify-between text-[10px] text-slate-500">
                               <span>{reportStatus.daysRecorded} / {reportStatus.daysRequired} 記錄天數</span>
                               <span>重置：週日</span>
                             </div>
                           </div>
                        )}
                      </div>
                      
                      <div>
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating || (reportStatus ? !reportStatus.canGenerate : false)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>分析中...</span>
                            </>
                          ) : (
                            <>
                              <span>生成分析報告</span>
                              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                        {error && <p className="mt-3 text-red-400 text-xs text-center bg-red-500/10 py-2 rounded border border-red-500/20">{error}</p>}
                        
                        {!reportStatus?.canGenerate && reportStatus && (
                          <div className="mt-3 text-xs text-center text-slate-400 flex items-center justify-center gap-2">
                            <Lock className="w-3 h-3" />
                            {reportStatus.reportsUsed >= reportStatus.reportsLimit 
                              ? "本週額度已用完"
                              : `還需 ${Math.max(0, reportStatus.daysRequired - reportStatus.daysRecorded)} 天記錄`}
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                <div className="flex flex-col justify-center lg:pl-8 relative">
                   <div className="absolute top-1/2 left-0 -translate-y-1/2 w-px h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />
                   <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                     解鎖你心靈的 <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">隱藏結構</span>
                   </h2>
                   <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                     夢境是潛意識的信使。每週一次，讓我們為你整理這些來自深處的信件，解讀其中反覆出現的符號與隱喻。
                   </p>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  歷史檔案
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report, idx) => {
                    const data = JSON.parse(report.analysis) as WeeklyReportData;
                    const startDate = new Date(report.startDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                    const endDate = new Date(report.endDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                    
                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedReport(report)}
                        className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-purple-500/30 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden flex flex-col h-full backdrop-blur-sm"
                      >
                        {/* Card Image Area */}
                        <div className="h-40 bg-black/20 relative overflow-hidden">
                           {report.imageBase64 ? (
                             <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" 
                                  style={{ backgroundImage: `url(data:image/png;base64,${report.imageBase64})` }} 
                             />
                           ) : (
                             <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                               <Brain className="w-10 h-10 text-white/10" />
                             </div>
                           )}
                           
                           {/* Date Badge */}
                           <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-medium text-white/80 shadow-lg">
                             {startDate} - {endDate}
                           </div>

                           {/* Overlay Gradient */}
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0f1230] via-transparent to-transparent opacity-80" />
                        </div>
                        
                        {/* Card Content */}
                        <div className="p-5 flex-grow flex flex-col relative -mt-6">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                            {data.word_of_the_week}
                          </h3>
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-grow">
                            {data.summary}
                          </p>
                          
                          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <div className="flex -space-x-1.5">
                                {data.themes.slice(0, 3).map((_, i) => (
                                  <div key={i} className="w-4 h-4 rounded-full bg-white/10 border border-black/50" style={{ backgroundColor: getTagColor(data.themes[i].name) }} />
                                ))}
                              </div>
                              {data.themes.length} 主題
                            </span>
                            <span className="text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              閱讀 <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {reports.length === 0 && !isGenerating && (
                  <div className="border border-white/5 border-dashed rounded-2xl p-12 text-center bg-white/[0.02]">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">尚無報告</h3>
                    <p className="text-slate-500 text-sm">持續記錄夢境，開啟每週深度分析。</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReportView({ report, isFree, onBack }: { report: WeeklyReport, isFree: boolean, onBack: () => void }) {
  const data = JSON.parse(report.analysis) as WeeklyReportData;
  const startDate = new Date(report.startDate).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  const endDate = new Date(report.endDate).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
       {/* Navigation */}
       <div className="sticky top-4 z-50 mb-6 flex justify-between items-center">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>
          <div className="text-[10px] font-mono text-slate-500 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/5">
            ID: {report.id.slice(0, 8).toUpperCase()}
          </div>
       </div>

       <div className="bg-[#0f1230] shadow-2xl shadow-black/50 rounded-[2rem] overflow-hidden border border-white/10 max-w-5xl mx-auto relative">
         {/* Ambient Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-purple-900/20 blur-[120px] pointer-events-none" />

         {/* Header Section */}
         <div className="relative p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-6">
              <Sparkles className="w-3 h-3" /> 每週分析
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {data.word_of_the_week}
            </h1>
            <p className="text-slate-400 font-medium">
              {startDate} — {endDate}
            </p>
         </div>

         {/* Split Content */}
         <div className="flex flex-col md:flex-row border-t border-white/5">
            {/* Left Sidebar */}
            <div className="md:w-[35%] border-r border-white/5 bg-black/20 p-6 md:p-8 space-y-8">
               {/* Visualization */}
               <div className="space-y-4">
                 <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">夢境映像</h3>
                 <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/10 relative group bg-black/40">
                    {report.imageBase64 ? (
                      <>
                        <img 
                          src={`data:image/png;base64,${report.imageBase64}`} 
                          alt="夢境映像" 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Brain className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed">
                    AI 根據本週夢境關鍵詞生成的潛意識映射圖。
                 </p>
               </div>

               {/* Emotional Arc */}
               <div className="space-y-3">
                 <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                   <Heart className="w-3 h-3" /> 情緒軌跡
                 </h3>
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                   <p className="text-sm text-slate-300 leading-relaxed italic">
                     &quot;{data.emotional_trajectory}&quot;
                   </p>
                 </div>
               </div>

               {/* Day Residue */}
               <div className="space-y-3">
                 <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                   <Zap className="w-3 h-3" /> 日間殘留
                 </h3>
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                   <p className="text-xs text-slate-400 leading-relaxed">
                     {data.day_residue_analysis}
                   </p>
                 </div>
               </div>
            </div>

            {/* Main Content */}
            <div className="md:w-[65%] p-6 md:p-10 space-y-10 bg-gradient-to-b from-transparent to-black/20">
               {/* Summary */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <FileText className="w-5 h-5 text-purple-400" />
                   總結摘要
                 </h3>
                 <p className="text-slate-300 text-lg leading-relaxed">
                   {data.summary}
                 </p>
               </section>

               {/* Deep Insight */}
               <section className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
                 <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wide mb-3 flex items-center gap-2 relative z-10">
                   <Fingerprint className="w-4 h-4" /> 深度心理洞察
                 </h3>
                 <p className="text-purple-100 text-base font-medium leading-relaxed relative z-10">
                   {data.deep_insight || "此版本無法顯示深度分析。"}
                 </p>
               </section>

               {/* Themes */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Brain className="w-5 h-5 text-blue-400" />
                   反覆出現的主題
                 </h3>
                 <div className="space-y-4">
                   {data.themes.map((theme, i) => (
                     <div key={i} className={`relative pl-6 border-l-2 border-white/10 hover:border-purple-500/50 transition-colors pb-1 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                       <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-[#0f1230] border-2 border-white/20" />
                       <h4 className="text-base font-bold text-slate-200 mb-1">
                         {theme.name}
                       </h4>
                       <p className="text-sm text-slate-400 leading-relaxed">
                         {theme.description}
                       </p>
                     </div>
                   ))}
                 </div>
                 {isFree && <PremiumLockOverlay />}
               </section>

               {/* Archetypes */}
               <section className="relative">
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Crown className="w-5 h-5 text-amber-400" />
                   原型模式
                 </h3>
                 <div className="grid md:grid-cols-2 gap-4">
                   {data.archetypes.map((arch, i) => (
                     <div key={i} className={`bg-amber-900/10 p-4 rounded-xl border border-amber-500/20 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                       <h4 className="text-sm font-bold text-amber-200 mb-2">{arch.name}</h4>
                       <p className="text-xs text-amber-100/60 leading-relaxed">{arch.explanation}</p>
                     </div>
                   ))}
                 </div>
                 {isFree && <PremiumLockOverlay />}
               </section>

               {/* Advice */}
               <section className="relative">
                  <div className={`bg-gradient-to-br from-slate-800 to-black p-8 rounded-2xl border border-white/10 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                    <Quote className="w-8 h-8 text-white/10 mb-4" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">整合建議</h3>
                    
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-base font-bold text-white mb-2">行動指引</h4>
                        <p className="text-slate-300 leading-relaxed">{data.advice}</p>
                      </div>
                      
                      <div className="pt-6 border-t border-white/10">
                        <h4 className="text-xs font-bold text-blue-400 mb-3">反思問題</h4>
                        <p className="text-lg text-white italic font-serif opacity-90">
                          &quot;{data.reflection_question}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                  {isFree && <PremiumLockOverlay dark />}
               </section>
            </div>
         </div>
       </div>
    </motion.div>
  );
}

function PremiumLockOverlay({ dark = false }: { dark?: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
       <div className={`backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center max-w-xs shadow-2xl pointer-events-auto ${dark ? 'bg-black/90' : 'bg-black/80'}`}>
         <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
           <Lock className="w-5 h-5 text-amber-400" />
         </div>
         <h4 className="text-sm font-bold text-white mb-1">深度版限定內容</h4>
         <p className="text-xs text-slate-400 mb-4">
           解鎖原型分析、隱藏主題與具體行動建議。
         </p>
         <Link href="/settings" className="block w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-amber-900/20">
           升級解鎖
         </Link>
       </div>
    </div>
  );
}
