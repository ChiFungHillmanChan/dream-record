'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { X, Copy, CheckCircle, Sparkles, ArrowLeft, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getDreamById, DreamWithAnalysis, getCurrentUser, CurrentUserInfo, DreamAnalysisResult } from '@/app/actions';
import { PLANS, ROLES } from '@/lib/constants';
import { DreamResult } from '@/components/DreamResult';
import { DreamLoading } from '@/components/DreamLoading';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [dream, setDream] = useState<DreamWithAnalysis | null>(null);
  const [user, setUser] = useState<CurrentUserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Ref for the content to capture as screenshot
  const captureRef = useRef<HTMLDivElement>(null);

  const dreamId = params.id as string;

  useEffect(() => {
    async function loadData() {
      const [dreamData, userData] = await Promise.all([
        getDreamById(dreamId),
        getCurrentUser()
      ]);
      setDream(dreamData);
      setUser(userData);
      setLoading(false);
    }
    loadData();
  }, [dreamId]);

  // Generate plain text report (no emojis/formatting)
  const generatePlainTextReport = (analysisData: DreamAnalysisResult) => {
    let text = `夢境解析報告

夢境摘要：${analysisData.summary}

氛圍：${analysisData.vibe}`;

    if (analysisData.analysis) {
      text += `\n\n深度分析：\n`;
      if (Array.isArray(analysisData.analysis)) {
        analysisData.analysis.forEach((item, i) => {
             text += `\n${i + 1}. ${item.title}: ${item.content}`;
        });
      } else {
        text += analysisData.analysis;
      }
      
      text += `\n\n建議：${analysisData.reflection}`;
    }

    text += `

    ---
    由 Dream Record 生成`;

    return text;
  };

  const handleCopy = async () => {
    if (!dream?.analysis) return;
    
    try {
      const analysisData = JSON.parse(dream.analysis);
      
      // Apply the same filtering logic as displayResult to ensure copying respects user plan
      const isPaidUser = user?.plan === PLANS.DEEP || user?.role === ROLES.SUPERADMIN;
      
      const dataToCopy = {
        ...analysisData,
        analysis: isPaidUser ? analysisData.analysis : null,
        reflection: isPaidUser ? analysisData.reflection : null,
      };

      const text = generatePlainTextReport(dataToCopy);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!captureRef.current || !dream?.analysis) return;
    
    setIsDownloading(true);
    
    try {
      // Wait a bit for the UI to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the content as an image
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#0a0a0f',
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: false, // Better cross-browser compatibility
        removeContainer: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
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

      // Generate filename with date
      const dateStr = new Date(dream.createdAt).toISOString().split('T')[0];
      const fileName = `Dream_Analysis_${dateStr}.pdf`;
      
      // Save the PDF
      pdf.save(fileName);

    } catch (err) {
      console.error('PDF Download failed:', err);
      alert('下載失敗，請稍後再試');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <DreamLoading 
        messages={[
          "正在準備分析報告...",
          "讀取夢境解析...",
          "呈現潛意識洞察..."
        ]} 
      />
    );
  }

  if (!dream || !dream.analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0f]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-[var(--muted)] mb-4">找不到此夢境解析</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={16} />
            返回首頁
          </Link>
        </motion.div>
      </div>
    );
  }

  let analysisData: DreamAnalysisResult;
  try {
    analysisData = JSON.parse(dream.analysis);
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-[var(--muted)]">解析資料格式錯誤</p>
      </div>
    );
  }

  // DEEP users and SUPERADMIN are treated as paid users
  const isPaidUser = user?.plan === PLANS.DEEP || user?.role === ROLES.SUPERADMIN;

  // Prepare data for DreamResult - handle hiding logic here
  const displayResult: DreamAnalysisResult = {
    ...analysisData,
    analysis: isPaidUser ? analysisData.analysis : null,
    reflection: isPaidUser ? analysisData.reflection : null,
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* Download Overlay Loading */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white"
          >
            <div className="w-16 h-16 relative mb-4">
              <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 rounded-full border-4 border-white/10 border-t-[var(--accent)]"
              />
              <Download className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent)]" />
            </div>
            <p className="text-lg font-medium">正在生成 PDF...</p>
            <p className="text-sm text-white/50 mt-2">請稍候</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/20 rounded-full blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--accent2)]/20 rounded-full blur-[100px]"
        />
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0],
              y: [0, -150],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3
            }}
            className="absolute w-1 h-1 rounded-full bg-white/50"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${50 + (i * 3) % 50}%`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="p-3 rounded-xl bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] hover:bg-white/10 transition-colors"
            title="複製文字報告"
          >
            {copied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-colors disabled:opacity-50 shadow-lg shadow-purple-900/30"
            title="下載 PDF 報告"
          >
            {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="p-3 rounded-xl bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] hover:bg-white/10 transition-colors"
            title="關閉"
          >
            <X size={20} />
          </motion.button>
        </motion.div>

        {/* Analysis Card - Expanded to max-w-5xl for "Full Report" feel */}
        <div className="max-w-5xl mx-auto pt-16 md:pt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Capturable Content Area */}
            <div ref={captureRef} className="p-6 md:p-10 rounded-[2.5rem]" style={{ backgroundColor: '#0a0a0f' }}>
              
              {/* Report Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[var(--accent2)] mb-4">
                    <span>DREAM ANALYSIS REPORT</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--accent)]"></span>
                    <span>#{dream.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[var(--accent)] via-white to-[var(--accent2)] bg-clip-text text-transparent mb-3"
                >
                  夢境解析報告
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[var(--muted)] text-lg"
                >
                  {new Date(dream.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </motion.p>
              </motion.div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Dream Content */}
                  <div className="lg:col-span-1">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-[var(--surface)]/30 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 h-full"
                      >
                        <h3 className="text-sm font-bold text-[var(--muted)] mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} /> 原始夢境
                        </h3>
                        <div className="text-white/80 whitespace-pre-wrap leading-relaxed text-sm md:text-base font-light italic">
                            &quot;{dream.content}&quot;
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {(() => {
                                try {
                                    const tags = JSON.parse(dream.tags || '[]');
                                    return tags.map((t: string) => (
                                        <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--muted)]">
                                            #{t}
                                        </span>
                                    ));
                                } catch { return null; }
                            })()}
                        </div>
                      </motion.div>
                  </div>

                  {/* Right Column: Analysis Result */}
                  <div className="lg:col-span-2">
                      <DreamResult result={displayResult} />
                  </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-[var(--muted)] text-xs">
                  <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] opacity-50"></div>
                      <span>Dream Record AI 分析</span>
                  </div>
                  <div className="font-mono opacity-50">
                      機密資料
                  </div>
              </div>
            </div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mt-8 pb-8"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-full hover:bg-white/5 hover:scale-105 transition-all text-[var(--muted)] hover:text-white"
              >
                <ArrowLeft size={18} />
                返回首頁
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
