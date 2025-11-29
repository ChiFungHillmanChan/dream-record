'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWeeklyReport, WeeklyReportData, WeeklyReportStatus } from '@/app/actions';
import { PLANS, ROLES } from '@/lib/constants';
import { Loader2, Lock, Sparkles, ArrowLeft, Brain, Heart, Zap, Crown, FileText, ChevronRight, Quote, Fingerprint, Calendar, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { WeeklyReport } from '@prisma/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  userRole: string;
  reportStatus: WeeklyReportStatus | null;
}

export default function WeeklyReportsClient({ initialReports, userPlan, userRole, reportStatus }: WeeklyReportsClientProps) {
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

  // SUPERADMIN users should always be treated as premium, regardless of plan
  const isFree = userPlan === PLANS.FREE && userRole !== ROLES.SUPERADMIN;

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16">
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
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <header className="flex items-center justify-between mb-16">
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
              <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-16 mb-20">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group shadow-2xl shadow-black/20">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
                   
                   <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
                          <Sparkles className="w-6 h-6 text-amber-300" />
                          每週洞察
                        </h2>
                        <p className="text-slate-400 text-base leading-relaxed mb-8">
                          將過去一週的夢境碎片拼湊成完整的潛意識地圖。發現隱藏的模式與情緒軌跡。
                        </p>
                        
                        {reportStatus && (
                           <div className="space-y-4 mb-8 bg-black/20 p-5 rounded-2xl border border-white/5">
                             <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                               <span>每週配額</span>
                               <span className={reportStatus.reportsUsed >= reportStatus.reportsLimit ? 'text-amber-400' : 'text-white'}>
                                 {reportStatus.reportsUsed} / {reportStatus.reportsLimit}
                               </span>
                             </div>
                             <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                               <div 
                                 className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                                 style={{ width: `${Math.min(100, (reportStatus.reportsUsed / reportStatus.reportsLimit) * 100)}%` }}
                               />
                             </div>
                             <div className="flex justify-between text-[11px] text-slate-500 font-medium">
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
                          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>分析中...</span>
                            </>
                          ) : (
                            <>
                              <span>生成分析報告</span>
                              <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                        {error && <p className="mt-4 text-red-400 text-sm text-center bg-red-500/10 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
                        
                        {!reportStatus?.canGenerate && reportStatus && (
                          <div className="mt-4 text-sm text-center text-slate-400 flex items-center justify-center gap-2 font-medium">
                            <Lock className="w-4 h-4" />
                            {reportStatus.reportsUsed >= reportStatus.reportsLimit 
                              ? "本週額度已用完"
                              : `還需 ${Math.max(0, reportStatus.daysRequired - reportStatus.daysRecorded)} 天記錄`}
                          </div>
                        )}
                      </div>
                   </div>
                </div>

                <div className="flex flex-col justify-center lg:pl-12 relative">
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
                            {cleanMarkdown(data.word_of_the_week)}
                          </h3>
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-grow">
                            {cleanMarkdown(data.summary)}
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

function cleanMarkdown(text: string) {
  if (!text) return "";
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
}

// --- Radar Chart Component ---
const RadarChart = ({ metrics }: { metrics: WeeklyReportData['metrics'] }) => {
  if (!metrics) return null;

  const data = [
    { label: '睡眠品質', value: metrics.sleepQualityIndex / 2, max: 5 }, // normalize 0-10 to 0-5
    { label: '情緒穩定', value: metrics.emotionVolatility, max: 5 },
    { label: '覺知力', value: metrics.lucidDreamCount > 5 ? 5 : metrics.lucidDreamCount, max: 5 },
    { label: '醒覺張力', value: metrics.awakeningArousalLevel, max: 5 },
    { label: '符號重複', value: metrics.recurringSymbolScore, max: 5 },
    { label: '噩夢指數', value: metrics.nightmareRatio / 20, max: 5 }, // normalize 0-100% to 0-5
  ];

  const size = 200;
  const center = size / 2;
  const radius = size / 2 - 40;
  const angleStep = (Math.PI * 2) / data.length;

  const getCoordinates = (value: number, index: number, max: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const points = data.map((d, i) => {
    const coords = getCoordinates(d.value, i, d.max);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div className="relative w-full max-w-[300px] mx-auto aspect-square">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Grid */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={data.map((_, i) => {
              const coords = getCoordinates(level, i, 5);
              return `${coords.x},${coords.y}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Axis Lines */}
        {data.map((_, i) => {
            const end = getCoordinates(5, i, 5);
            return (
                <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke="rgba(255, 255, 255, 0.1)" />
            )
        })}

        {/* Data Polygon */}
        <polygon
          points={points}
          fill="rgba(168, 85, 247, 0.2)"
          stroke="rgba(168, 85, 247, 0.8)"
          strokeWidth="2"
        />
        
        {/* Labels */}
        {data.map((d, i) => {
          const coords = getCoordinates(6, i, 5); // Push label out a bit
          return (
            <text
              key={i}
              x={coords.x}
              y={coords.y}
              textAnchor="middle"
              dy="0.3em"
              fill="rgba(255,255,255,0.7)"
              fontSize="10"
              className="uppercase tracking-wide"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

function ReportView({ report, isFree, onBack }: { report: WeeklyReport, isFree: boolean, onBack: () => void }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const data = JSON.parse(report.analysis) as WeeklyReportData;
  const startDate = new Date(report.startDate).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });
  const endDate = new Date(report.endDate).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' });

  // Clean up potential legacy/markdown data structure issues
  const safeData = {
    ...data,
    word_of_the_week: cleanMarkdown(data.word_of_the_week),
    summary: cleanMarkdown(data.summary),
    emotional_trajectory: cleanMarkdown(data.emotional_trajectory),
    day_residue_analysis: cleanMarkdown(data.day_residue_analysis),
    deep_insight: cleanMarkdown(data.deep_insight),
    advice: cleanMarkdown(data.advice),
    reflection_question: cleanMarkdown(data.reflection_question),
    themes: data.themes ? data.themes.map(t => ({
        ...t,
        name: cleanMarkdown(t.name),
        description: cleanMarkdown(t.description)
    })) : [],
    archetypes: data.archetypes ? data.archetypes.map(a => ({
        ...a,
        name: cleanMarkdown(a.name),
        explanation: cleanMarkdown(a.explanation)
    })) : [],
    psychological_analysis: data.psychological_analysis || {
        perspective_1: { name: "分析視角 1", content: "資料格式更新中..." },
        perspective_2: { name: "分析視角 2", content: "資料格式更新中..." }
    },
    metrics: data.metrics || {
        sleepQualityIndex: 0,
        nightmareRatio: 0,
        recurringSymbolScore: 0,
        awakeningArousalLevel: 0,
        lucidDreamCount: 0,
        emotionVolatility: 0
    },
    interventions: data.interventions || [],
    disclaimer: data.disclaimer || "本報告提供心理象徵與模式識別洞察，不等同醫療診斷。",
    quality_check_status: data.quality_check_status || "品質檢核通過"
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
      // Wait a bit for the UI to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Detect device capabilities
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid || window.innerWidth < 768;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

      // Generate filename with date
      const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
      const fileName = `Weekly_Dream_Report_${dateStr}_${safeData.word_of_the_week}.pdf`;

      // Capture the content as an image with mobile-optimized settings
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f1230',
        scale: isMobile ? 1.5 : 2, // Lower resolution for mobile to prevent memory issues
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: true,
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png', isMobile ? 0.8 : 1.0);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Get PDF as blob
      const pdfBlob = pdf.output('blob');

      // Mobile-specific download handling
      if (isMobile || isStandalone) {
        // First, try Web Share API with file sharing (best UX on mobile)
        if (navigator.canShare && navigator.share) {
          try {
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: '夢境週報',
                text: '我的夢境週報分析'
              });
              return;
            }
          } catch (shareErr) {
            // Share was cancelled or not supported, continue to fallback
            console.log('Share API not available or cancelled, trying fallback...');
          }
        }

        // Fallback: Create object URL and use download link with proper handling
        const blobUrl = URL.createObjectURL(pdfBlob);

        // For iOS, try opening in new window first
        if (isIOS) {
          // Create a hidden iframe to trigger download on iOS
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          document.body.appendChild(iframe);

          // Try direct link click
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);

          // Trigger click
          link.click();

          // Cleanup after delay
          setTimeout(() => {
            document.body.removeChild(link);
            document.body.removeChild(iframe);
            URL.revokeObjectURL(blobUrl);
          }, 5000);
        } else {
          // Android and other mobile browsers
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          link.target = '_self';
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 5000);
        }
      } else {
        // Desktop browsers - standard download
        pdf.save(fileName);
      }

    } catch (err) {
      console.error("PDF Generation failed:", err);
      // Provide more helpful error message
      if (err instanceof Error && err.message.includes('memory')) {
        alert('下載失敗：記憶體不足，請嘗試關閉其他應用程式後再試');
      } else {
        alert('下載失敗，請稍後再試。如持續失敗，請嘗試使用電腦版下載。');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
       {/* Navigation & Actions */}
       <div className="sticky top-4 z-50 mb-6 flex justify-between items-center">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-mono text-slate-500 bg-black/50 backdrop-blur px-3 py-2 rounded-full border border-white/5 hidden md:block">
                ID: {report.id.slice(0, 8).toUpperCase()}
            </div>
            <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50"
            >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? '生成中...' : '下載 PDF'}
            </button>
          </div>
       </div>

       {/* Report Container - Ref for PDF */}
       <div ref={reportRef} className="bg-[#0f1230] shadow-2xl shadow-black/50 rounded-[2rem] overflow-hidden border border-white/10 max-w-5xl mx-auto relative">
         {/* Ambient Glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-purple-900/20 blur-[120px] pointer-events-none" />

         {/* Header Section */}
         <div className="relative p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold tracking-widest uppercase mb-6">
              <Sparkles className="w-3 h-3" /> 專業深度夢境週報
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              {safeData.word_of_the_week}
            </h1>
            <p className="text-slate-400 font-medium mb-6">
              {startDate} — {endDate}
            </p>
            
            {/* Quality Check Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3 h-3" /> {safeData.quality_check_status}
            </div>
         </div>

         {/* Split Content */}
         <div className="flex flex-col md:flex-row border-t border-white/5">
            {/* Left Sidebar - Visuals & Metrics */}
            <div className="md:w-[35%] border-r border-white/5 bg-black/20 p-8 md:p-10 space-y-10">
               {/* Visualization */}
               <div className="space-y-4">
                 <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">潛意識映射</h3>
                 <div className="aspect-[4/3] md:aspect-square w-full rounded-2xl overflow-hidden border border-white/10 relative group bg-black/40 shadow-inner">
                    {report.imageBase64 ? (
                      <>
                        <Image 
                          src={`data:image/png;base64,${report.imageBase64}`} 
                          alt="夢境映像" 
                          fill
                          className="object-contain opacity-80 group-hover:opacity-100 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Brain className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                 </div>
               </div>

               {/* Metrics Radar */}
               <div className="space-y-4">
                 <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                   <Fingerprint className="w-3 h-3" /> 心理指標雷達
                 </h3>
                 <RadarChart metrics={safeData.metrics} />
                 <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-4">
                    <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                        <span className="block text-purple-300 font-bold">{safeData.metrics.sleepQualityIndex}/10</span>
                        睡眠品質
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                        <span className="block text-red-300 font-bold">{safeData.metrics.nightmareRatio}%</span>
                        噩夢佔比
                    </div>
                 </div>
               </div>

               {/* Emotional Arc */}
               <div className="space-y-3">
                 <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                   <Heart className="w-3 h-3" /> 情緒軌跡
                 </h3>
                 <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                   <p className="text-sm text-slate-300 leading-relaxed italic">
                     &quot;{safeData.emotional_trajectory}&quot;
                   </p>
                 </div>
               </div>
            </div>

            {/* Main Content */}
            <div className="md:w-[65%] p-8 md:p-12 space-y-12 bg-gradient-to-b from-transparent to-black/20">
               {/* Summary */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <FileText className="w-5 h-5 text-purple-400" />
                   本週分析摘要
                 </h3>
                 <p className="text-slate-300 text-lg leading-relaxed">
                   {safeData.summary}
                 </p>
               </section>

               {/* Psychological Analysis (Dual Perspective) */}
               <section className="space-y-6">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Brain className="w-5 h-5 text-blue-400" />
                   雙視角心理分析
                 </h3>
                 
                 <div className={`grid md:grid-cols-2 gap-6 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                    {/* Perspective 1 */}
                    <div className="bg-[#1e1b4b]/40 p-6 rounded-2xl border border-indigo-500/20">
                        <h4 className="text-indigo-300 font-bold mb-3 text-sm uppercase tracking-wide">
                            {safeData.psychological_analysis.perspective_1.name}
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {safeData.psychological_analysis.perspective_1.content}
                        </p>
                    </div>
                    {/* Perspective 2 */}
                    <div className="bg-[#3f2c33]/40 p-6 rounded-2xl border border-rose-500/20">
                        <h4 className="text-rose-300 font-bold mb-3 text-sm uppercase tracking-wide">
                            {safeData.psychological_analysis.perspective_2.name}
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {safeData.psychological_analysis.perspective_2.content}
                        </p>
                    </div>
                 </div>
                 {isFree && <PremiumLockOverlay />}
               </section>

               {/* Themes */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Zap className="w-5 h-5 text-amber-400" />
                   核心主題與權重
                 </h3>
                 <div className="space-y-4">
                   {safeData.themes.map((theme, i) => (
                     <div key={i} className={`relative p-4 bg-white/5 rounded-xl border border-white/5 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                       <div className="flex justify-between items-start mb-2">
                           <h4 className="text-base font-bold text-slate-200">
                             {theme.name}
                           </h4>
                           <div className="flex gap-1">
                               {[...Array(5)].map((_, idx) => (
                                   <div key={idx} className={`w-1.5 h-3 rounded-sm ${idx < (theme.score || 3) ? 'bg-purple-500' : 'bg-white/10'}`} />
                               ))}
                           </div>
                       </div>
                       <p className="text-sm text-slate-400 leading-relaxed">
                         {theme.description}
                       </p>
                     </div>
                   ))}
                 </div>
                 {isFree && <PremiumLockOverlay />}
               </section>

               {/* Interventions / Action Plan */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                   <Crown className="w-5 h-5 text-emerald-400" />
                   專業干預建議
                 </h3>
                 <div className={`grid gap-4 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                    {safeData.interventions.map((item, idx) => (
                        <div key={idx} className="flex gap-4 bg-emerald-900/10 p-5 rounded-xl border border-emerald-500/20">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                             </div>
                             <div>
                                 <div className="flex items-baseline gap-2 mb-1">
                                    <h4 className="font-bold text-emerald-100">{item.title}</h4>
                                    <span className="text-[10px] text-emerald-500 uppercase border border-emerald-500/30 px-1.5 rounded">{item.technique}</span>
                                 </div>
                                 <p className="text-sm text-emerald-200/80 mb-2">{item.steps}</p>
                                 <div className="text-xs text-emerald-500 font-mono">
                                     建議時長：{item.duration}
                                 </div>
                             </div>
                        </div>
                    ))}
                 </div>
                 {isFree && <PremiumLockOverlay />}
               </section>

               {/* Advice & Reflection */}
               <section className="relative">
                  <div className={`bg-gradient-to-br from-slate-800 to-black p-8 rounded-2xl border border-white/10 ${isFree ? 'blur-sm select-none opacity-50' : ''}`}>
                    <Quote className="w-8 h-8 text-white/10 mb-4" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">生活建議 & 反思</h3>
                    
                    <div className="space-y-8">
                      <div>
                        <p className="text-slate-300 leading-relaxed">{safeData.advice}</p>
                      </div>
                      
                      <div className="pt-6 border-t border-white/10">
                        <h4 className="text-xs font-bold text-blue-400 mb-3">本週禪機一問</h4>
                        <p className="text-lg text-white italic font-serif opacity-90">
                          &quot;{safeData.reflection_question}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                  {isFree && <PremiumLockOverlay dark />}
               </section>
            </div>
         </div>

         {/* Footer / Disclaimer */}
         <div className="bg-black/40 p-6 text-center border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-amber-500/80 text-xs mb-2">
                <AlertTriangle className="w-3 h-3" /> 免責聲明
            </div>
            <p className="text-[10px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
                {safeData.disclaimer}
            </p>
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
           解鎖雙視角心理分析、專業干預建議與詳細指標。
         </p>
         <Link href="/settings" className="block w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-amber-900/20">
           升級解鎖
         </Link>
       </div>
    </div>
  );
}
