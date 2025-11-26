'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWeeklyReport, WeeklyReportData, WeeklyReportStatus } from '@/app/actions';
import { PLANS } from '@/lib/constants';
import { Loader2, Lock, Sparkles, ArrowLeft, Calendar, Brain, Heart, Zap, Crown, AlertCircle, FileText, ChevronRight, Quote, Fingerprint } from 'lucide-react';
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
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans selection:bg-blue-100">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

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
              transition={{ duration: 0.3 }}
            >
              {/* Professional Header */}
              <header className="flex items-center justify-between mb-12 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm group">
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </Link>
                  <div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Dream Analysis Reports</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Psychological Profile & Subconscious Tracking</p>
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Confidential</p>
                  <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                </div>
              </header>

              {/* Hero Section / Generator */}
              <div className="grid lg:grid-cols-3 gap-8 mb-16">
                <div className="lg:col-span-1">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col justify-between relative overflow-hidden">
                      <div className="relative z-10">
                        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          Generate Report
                        </h2>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                          Compile your recent dreams into a comprehensive psychological analysis. Discover hidden patterns and subconscious shifts.
                        </p>
                        
                        {reportStatus && (
                           <div className="space-y-3 mb-6">
                             <div className="flex justify-between text-sm">
                               <span className="text-slate-500">Quota Status</span>
                               <span className="font-medium text-slate-800">
                                 {reportStatus.reportsUsed}/{reportStatus.reportsLimit}
                                 {reportStatus.isPremium && <Crown className="inline w-3 h-3 ml-1 text-amber-500" />}
                               </span>
                             </div>
                             <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                               <div 
                                 className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                 style={{ width: `${Math.min(100, (reportStatus.reportsUsed / reportStatus.reportsLimit) * 100)}%` }}
                               />
                             </div>
                             <div className="flex justify-between text-xs text-slate-400">
                               <span>{reportStatus.daysRecorded}/{reportStatus.daysRequired} days recorded</span>
                               <span>Reset: Sun</span>
                             </div>
                           </div>
                        )}
                      </div>
                      
                      <div className="relative z-10 mt-auto">
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating || (reportStatus ? !reportStatus.canGenerate : false)}
                          className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-medium shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <span>Generate Analysis</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        {error && <p className="mt-3 text-red-500 text-xs text-center bg-red-50 py-2 rounded">{error}</p>}
                        
                        {!reportStatus?.canGenerate && reportStatus && (
                          <div className="mt-3 text-xs text-center text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                            {reportStatus.reportsUsed >= reportStatus.reportsLimit 
                              ? "Weekly quota reached"
                              : `Need ${reportStatus.daysRequired - reportStatus.daysRecorded} more days of records`}
                          </div>
                        )}
                      </div>

                      {/* Decorative bg element */}
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl" />
                   </div>
                </div>

                <div className="lg:col-span-2 flex flex-col justify-center pl-0 lg:pl-8">
                   <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4 leading-tight">
                     Unlocking the <br/>
                     <span className="text-blue-700">Architecture of Your Mind</span>
                   </h2>
                   <p className="text-slate-600 text-lg max-w-xl leading-relaxed">
                     Each week, we act as your personal psychoanalyst, weaving your nightly fragments into a coherent narrative of your inner life.
                   </p>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Archived Reports
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report, idx) => {
                    const data = JSON.parse(report.analysis) as WeeklyReportData;
                    const startDate = new Date(report.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const endDate = new Date(report.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    
                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedReport(report)}
                        className="group relative bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-0 cursor-pointer hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden flex flex-col h-full"
                      >
                        <div className="h-32 bg-slate-100 relative overflow-hidden">
                           {report.imageBase64 ? (
                             <div className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0" 
                                  style={{ backgroundImage: `url(data:image/png;base64,${report.imageBase64})` }} 
                             />
                           ) : (
                             <div className="absolute inset-0 flex items-center justify-center">
                               <Brain className="w-10 h-10 text-slate-300" />
                             </div>
                           )}
                           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-slate-600 shadow-sm">
                             {startDate} - {endDate}
                           </div>
                        </div>
                        
                        <div className="p-5 flex-grow flex flex-col">
                          <h3 className="text-xl font-serif font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                            {data.word_of_the_week}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-grow leading-relaxed">
                            {data.summary}
                          </p>
                          
                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Brain className="w-3 h-3" /> {data.themes.length} Themes
                            </span>
                            <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              Read Report <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {reports.length === 0 && !isGenerating && (
                  <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No Reports Yet</h3>
                    <p className="text-slate-500">Record more dreams to enable weekly analysis.</p>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="bg-white shadow-2xl shadow-slate-200/50 rounded-xl overflow-hidden border border-slate-200 max-w-4xl mx-auto"
    >
      {/* Report Header - Document Style */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-slate-500 hover:text-slate-900 text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Archive
          </button>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">
            {data.word_of_the_week}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              WEEKLY ANALYSIS
            </span>
            <span className="text-slate-500">
              {startDate} - {endDate}
            </span>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-xs font-bold tracking-widest text-slate-300 uppercase mb-1">Report ID</div>
          <div className="font-mono text-slate-400">{report.id.slice(0, 8)}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left Sidebar - Visuals & Key Metrics */}
        <div className="md:w-1/3 bg-slate-50/50 border-r border-slate-100 p-6 md:p-8 space-y-8">
           {/* Generated Image - Framed */}
           <div className="space-y-3">
             <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Visual Synthesis</h3>
             <div className="aspect-square w-full bg-white p-2 border border-slate-200 shadow-sm rounded-lg rotate-1 hover:rotate-0 transition-transform duration-500">
               {report.imageBase64 ? (
                 <img 
                   src={`data:image/png;base64,${report.imageBase64}`} 
                   alt="Dream Collage" 
                   className="w-full h-full object-cover rounded-sm grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                 />
               ) : (
                 <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                   <Sparkles className="text-slate-300" />
                 </div>
               )}
             </div>
             <p className="text-[10px] text-slate-400 italic text-center">
               AI-generated subconscious visualization
             </p>
           </div>

           {/* Emotional Trajectory */}
           <div className="space-y-3">
             <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
               <Heart className="w-3 h-3" /> Emotional Arc
             </h3>
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
               <p className="text-sm text-slate-700 leading-relaxed italic">
                 &ldquo;{data.emotional_trajectory}&rdquo;
               </p>
             </div>
           </div>

           {/* Day Residue */}
           <div className="space-y-3">
             <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
               <Zap className="w-3 h-3" /> Day Residue
             </h3>
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
               <p className="text-sm text-slate-600 leading-relaxed">
                 {data.day_residue_analysis}
               </p>
             </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="md:w-2/3 p-6 md:p-10 space-y-10">
           {/* Executive Summary */}
           <section>
             <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 flex items-center gap-2">
               <FileText className="w-5 h-5 text-blue-600" />
               Executive Summary
             </h3>
             <div className="prose prose-slate max-w-none">
               <p className="text-lg leading-relaxed text-slate-700 first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:mr-1 first-letter:float-left">
                 {data.summary}
               </p>
             </div>
           </section>

           <div className="h-px bg-slate-100 w-full" />

           {/* Deep Insight - Highlight */}
           <section className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-600">
             <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
               <Fingerprint className="w-4 h-4" /> Core Psychological Insight
             </h3>
             <p className="text-blue-900 text-lg font-medium leading-relaxed">
               {data.deep_insight || "Analysis not available in this version."}
             </p>
           </section>

           {/* Themes */}
           <section className="relative">
             <h3 className="text-lg font-serif font-bold text-slate-900 mb-6 flex items-center gap-2">
               <Brain className="w-5 h-5 text-purple-600" />
               Recurrent Themes
             </h3>
             <div className="grid gap-6">
               {data.themes.map((theme, i) => (
                 <div key={i} className={`group ${isFree ? 'blur-sm select-none opacity-40' : ''}`}>
                   <div className="flex items-baseline gap-3 mb-2">
                     <span className="text-xs font-bold text-slate-300">0{i+1}</span>
                     <h4 className="text-base font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                       {theme.name}
                     </h4>
                   </div>
                   <p className="text-slate-600 text-sm leading-relaxed pl-7 border-l border-slate-200 group-hover:border-purple-200 transition-colors">
                     {theme.description}
                   </p>
                 </div>
               ))}
             </div>
             {isFree && <PremiumLockOverlay />}
           </section>

           {/* Archetypes */}
           <section className="relative">
             <h3 className="text-lg font-serif font-bold text-slate-900 mb-6 flex items-center gap-2">
               <Crown className="w-5 h-5 text-amber-600" />
               Archetypal Patterns
             </h3>
             <div className="grid md:grid-cols-2 gap-4">
               {data.archetypes.map((arch, i) => (
                 <div key={i} className={`bg-amber-50/50 p-4 rounded-lg border border-amber-100 ${isFree ? 'blur-sm select-none opacity-40' : ''}`}>
                   <h4 className="text-sm font-bold text-amber-900 mb-2">{arch.name}</h4>
                   <p className="text-xs text-amber-800/80 leading-relaxed">{arch.explanation}</p>
                 </div>
               ))}
             </div>
             {isFree && <PremiumLockOverlay />}
           </section>

           {/* Action & Advice */}
           <section className="relative">
              <div className={`bg-slate-900 text-white p-8 rounded-xl shadow-xl ${isFree ? 'blur-sm select-none opacity-40' : ''}`}>
                <Quote className="w-8 h-8 text-blue-400 mb-4 opacity-50" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Integration Practice</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-serif font-bold text-white mb-2">Action Item</h4>
                    <p className="text-slate-300 leading-relaxed">{data.advice}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-sm font-bold text-blue-300 mb-2">Reflection Question</h4>
                    <p className="text-lg text-white italic font-serif">
                      &ldquo;{data.reflection_question}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
              {isFree && <PremiumLockOverlay dark />}
           </section>
        </div>
      </div>
    </motion.div>
  );
}

function PremiumLockOverlay({ dark = false }: { dark?: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
       <div className={`${dark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'} p-6 rounded-xl border shadow-lg backdrop-blur-sm text-center max-w-xs`}>
         <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
           <Lock className="w-5 h-5 text-amber-600" />
         </div>
         <h4 className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'} mb-1`}>Premium Analysis</h4>
         <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
           Unlock archetypes, hidden themes, and actionable advice.
         </p>
         <Link href="/settings" className="block w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors">
           Upgrade to Unlock
         </Link>
       </div>
    </div>
  );
}
