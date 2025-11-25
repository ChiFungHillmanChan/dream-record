'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Mic, RotateCcw, Search, Trash2, Edit2, 
  ChevronLeft, ChevronRight,
  Download, Upload, Settings, Shield, Crown
} from 'lucide-react';
import { DreamData, getDreams, saveDream, deleteDream, analyzeDream, DreamAnalysisResult, getCurrentUser, CurrentUserInfo } from '@/app/actions';
import { ROLES, PLANS } from '@/lib/constants';
import type { Dream } from '@prisma/client';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// --- Types & Constants ---
type CalendarMode = 'month' | 'week' | 'day';

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
        [key: number]: {
            [key: number]: {
                transcript: string;
            };
            isFinal: boolean;
        };
        length: number;
    };
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onend: () => void;
}

interface WindowWithSpeech extends Window {
    SpeechRecognition?: { new(): SpeechRecognition };
    webkitSpeechRecognition?: { new(): SpeechRecognition };
}

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

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// --- Helper Components ---

const Chip = ({ label, active, onClick, onRemove }: { label: string, active?: boolean, onClick?: () => void, onRemove?: () => void }) => {
  const color = getTagColor(label);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-full text-sm border transition-all select-none flex items-center gap-2",
        active ? "bg-opacity-30" : "bg-opacity-10 hover:bg-opacity-20"
      )}
      style={{
        borderColor: color,
        backgroundColor: active ? color : `${color}20`,
        color: '#eef',
        boxShadow: `inset 0 0 0 1px ${color}`
      }}
    >
      {label}
      {onRemove && <span onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:text-white">×</span>}
    </button>
  );
};

// --- Main Component ---

export default function DreamJournal() {
  // Data State
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  // Record State
  const [dreamText, setDreamText] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [customTagInput, setCustomTagInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DreamAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // History/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dream' | 'no_dream'>('all');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const importRef = useRef<HTMLInputElement>(null);
  const [todayStr, setTodayStr] = useState('');

  // Constants
  const defaultTags = ['開心','可怕','感動','親情','離世','奇幻','追逐','飛翔','戀愛','工作','考試','清醒夢','噩夢','搞笑'];
  
  // Load Data & set today's date on client
  useEffect(() => {
    loadDreams();
    loadCurrentUser();
    setTodayStr(new Date().toLocaleDateString());
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const win = window as unknown as WindowWithSpeech;
        const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
        if (SR) {
            const recognition = new SR();
            recognition.lang = 'zh-Hant';
            recognition.continuous = true;
            recognition.interimResults = true;
            
            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalText = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalText += event.results[i][0].transcript;
                    }
                }
                if (finalText) {
                    setDreamText(prev => prev + (prev ? ' ' : '') + finalText);
                }
            };

            recognition.onend = () => {
               setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }
  }, []);

  const toggleListening = () => {
      if (!recognitionRef.current) {
          alert('此瀏覽器不支援語音輸入');
          return;
      }
      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const loadDreams = async () => {
    const data = await getDreams();
    setDreams(data);
  };

  // Stats
  const stats = {
    total: dreams.length,
    dream: dreams.filter(d => d.type === 'dream').length,
    noDream: dreams.filter(d => d.type === 'no_dream').length
  };

  // Streak Calculation
  const getStreak = () => {
    const uniqueDates = new Set(dreams.map(d => d.date));
    const today = new Date().toISOString().split('T')[0];
    let current = 0;
    const dateIterator = new Date(today);
    
    while (uniqueDates.has(dateIterator.toISOString().split('T')[0])) {
      current++;
      dateIterator.setDate(dateIterator.getDate() - 1);
    }
    return current;
  };

  // Actions
  const handleSave = async (type: 'dream' | 'no_dream' = 'dream') => {
    if (!dreamText.trim() && type === 'dream' && selectedTags.size === 0 && !confirm('內容與標籤皆為空，仍要保存嗎？')) return;
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const data: DreamData = {
      id: editingId || undefined,
      content: type === 'no_dream' ? '今天竟沒有發夢（或是忘了）' : dreamText,
      type,
      date: dateStr,
      tags: Array.from(selectedTags),
    };

    const res = await saveDream(data);
    if (res.success) {
      setDreamText('');
      setSelectedTags(new Set());
      setEditingId(null);
      setAnalysisResult(null);
      loadDreams();
    } else {
      alert('保存失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除此筆紀錄嗎？')) {
      await deleteDream(id);
      loadDreams();
    }
  };

  const handleEdit = (dream: Dream) => {
    setEditingId(dream.id);
    setDreamText(dream.content);
    try {
      setSelectedTags(new Set(JSON.parse(dream.tags)));
    } catch {
      setSelectedTags(new Set());
    }
    setActiveTab('record');
  };

  const handleAnalyze = async () => {
    if (!dreamText) return;
    setIsAnalyzing(true);
    const result = await analyzeDream(dreamText);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleExport = () => {
      const data = {
          version: 1,
          exportedAt: new Date().toISOString(),
          entries: dreams
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dream-journal-backup.json';
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
          try {
              const data = JSON.parse(reader.result as string);
              if (!Array.isArray(data.entries)) throw new Error('格式錯誤');
              
              if (!confirm('匯入將合併資料，是否繼續？')) return;

              // Import simply by saving each entry
              for (const entry of data.entries) {
                  let tags = [];
                  try { tags = typeof entry.tags === 'string' ? JSON.parse(entry.tags) : entry.tags; } catch {}
                  
                  await saveDream({
                      id: entry.id,
                      content: entry.content,
                      type: entry.type,
                      date: entry.date,
                      tags: tags
                  });
              }
              loadDreams();
              alert('匯入完成');
          } catch (err) {
              alert('匯入失敗');
              console.error(err);
          }
      };
      reader.readAsText(file);
  };

  // --- Views ---

  const renderStreakGrid = () => {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check logic
      const dayDreams = dreams.filter(x => x.date === dateStr);
      let status = 'none';
      if (dayDreams.some(x => x.type === 'dream')) status = 'dream';
      else if (dayDreams.some(x => x.type === 'no_dream')) status = 'no_dream';

      days.push(
        <div 
          key={i} 
          className={cn(
            "h-4 rounded-md border border-white/20 cursor-pointer transition-all hover:opacity-80",
            status === 'none' && "bg-white/5",
            status === 'no_dream' && "bg-gradient-to-b from-white/10 to-white/5",
            status === 'dream' && "bg-gradient-to-b from-[var(--accent2)]/30 to-[var(--accent)]/40"
          )}
          title={`${dateStr} - ${status}`}
          onClick={() => {
             setSelectedDateStr(dateStr);
             setActiveTab('history');
             setCalendarMode('day');
          }}
        />
      );
    }
    return <div className="grid grid-cols-14 gap-1.5 w-full max-w-[560px]">{days}</div>;
  };

  // Calendar Logic helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Padding for start
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border border-[var(--border)] rounded-2xl bg-[var(--surface)] mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-radial from-white via-[#d9d9ff] to-[var(--accent)] shadow-[0_0_12px_rgba(167,139,250,0.5)]" />
          <div>
            <div className="font-bold text-base">今天：{todayStr || '載入中...'}</div>
            <div className="text-xs text-[var(--muted)]">醒來就記下夢的碎片吧</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]">
                <div>
                    <div className="text-2xl font-extrabold tracking-wide">{getStreak()} 日</div>
                    <div className="text-xs text-[var(--muted)]">連續紀錄</div>
                </div>
                {renderStreakGrid()}
            </div>
            {/* Plan Badge */}
            {currentUser?.plan === PLANS.DEEP && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <Crown size={14} className="text-amber-400" />
                <span className="text-xs text-purple-300 font-medium">深度版</span>
              </div>
            )}
            {/* Admin Link */}
            {currentUser?.role === ROLES.SUPERADMIN && (
              <Link 
                href="/admin" 
                className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-colors text-amber-400"
                title="管理控制台"
              >
                <Shield size={20} />
              </Link>
            )}
            <Link href="/settings" className="p-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] hover:bg-white/5 transition-colors text-[var(--muted)] hover:text-white">
                <Settings size={20} />
            </Link>
        </div>
      </header>
      
      <div className="md:hidden mb-4">{renderStreakGrid()}</div>

      {/* Tab Nav */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('record')}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all",
            activeTab === 'record' && "bg-gradient-to-b from-[var(--accent)]/20 to-[var(--accent2)]/10 text-white border-[rgba(167,139,250,0.6)]"
          )}
        >
          <Edit2 size={16} />
          <span>記錄</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-all",
            activeTab === 'history' && "bg-gradient-to-b from-[var(--accent)]/20 to-[var(--accent2)]/10 text-white border-[rgba(167,139,250,0.6)]"
          )}
        >
          <RotateCcw size={16} />
          <span>歷史</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'record' ? (
          <motion.section 
            key="record"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4"
          >
            <h2 className="text-lg mb-3 font-bold">今天的夢境</h2>
            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-4">
              <div className="flex flex-col gap-2">
                 <textarea
                   value={dreamText}
                   onChange={(e) => setDreamText(e.target.value)}
                   placeholder="剛醒來？把夢境碎片記下來..."
                   className="w-full min-h-[180px] p-3 rounded-xl bg-[#0f1230] border border-[var(--border)] focus:outline-none focus:border-[var(--accent2)] resize-none"
                 />
                 <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={toggleListening}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all",
                            isListening 
                                ? "bg-red-500/20 text-red-200 border border-red-500/50 animate-pulse"
                                : "bg-gradient-to-r from-[#67e8f9] to-[#a78bfa] text-[#001]"
                        )}
                    >
                        <Mic size={14} /> {isListening ? '停止收聽' : '語音輸入'}
                    </button>
                    <button 
                        onClick={() => { setDreamText(''); setAnalysisResult(null); }}
                        className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--muted)] text-sm hover:bg-white/5"
                    >
                        清空
                    </button>
                     <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !dreamText}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {isAnalyzing ? '分析中...' : 'AI 解析'}
                    </button>
                 </div>
                 
                 {analysisResult && (
                    <div className="mt-2 p-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--accent)]/30 text-sm space-y-2">
                        <div className="font-bold text-[var(--accent2)]">✨ 夢境解析</div>
                        <p><strong>摘要：</strong>{analysisResult.summary}</p>
                        <p><strong>分析：</strong>{analysisResult.analysis}</p>
                        <p><strong>氛圍：</strong>{analysisResult.vibe}</p>
                        <p><strong>建議：</strong>{analysisResult.reflection}</p>
                    </div>
                 )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#eaeaff] mb-2">標籤</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                    {defaultTags.map(tag => (
                        <Chip 
                            key={tag} 
                            label={tag} 
                            active={selectedTags.has(tag)} 
                            onClick={() => {
                                const next = new Set(selectedTags);
                                if (next.has(tag)) next.delete(tag);
                                else next.add(tag);
                                setSelectedTags(next);
                            }}
                        />
                    ))}
                    {Array.from(selectedTags).filter(t => !defaultTags.includes(t)).map(tag => (
                         <Chip 
                            key={tag} 
                            label={tag} 
                            active={true} 
                            onClick={() => {
                                const next = new Set(selectedTags);
                                next.delete(tag);
                                setSelectedTags(next);
                            }}
                        />
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="＋ 自訂標籤"
                        className="flex-1 px-3 py-2 rounded-xl bg-[#0f1230] border border-[var(--border)] text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && customTagInput.trim()) {
                                setSelectedTags(new Set(selectedTags).add(customTagInput.trim()));
                                setCustomTagInput('');
                            }
                        }}
                    />
                    <button 
                        onClick={() => {
                            if(customTagInput.trim()) {
                                setSelectedTags(new Set(selectedTags).add(customTagInput.trim()));
                                setCustomTagInput('');
                            }
                        }}
                        className="px-3 py-2 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)]"
                    >
                        加入
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-[#0f1230] p-2 rounded-xl border border-[var(--border)] text-center">
                        <div className="text-xl font-bold">{stats.total}</div>
                        <div className="text-xs text-[var(--muted)]">總筆數</div>
                    </div>
                    <div className="bg-[#0f1230] p-2 rounded-xl border border-[var(--border)] text-center">
                        <div className="text-xl font-bold">{stats.dream}</div>
                        <div className="text-xs text-[var(--muted)]">夢境</div>
                    </div>
                    <div className="bg-[#0f1230] p-2 rounded-xl border border-[var(--border)] text-center">
                        <div className="text-xl font-bold">{stats.noDream}</div>
                        <div className="text-xs text-[var(--muted)]">無夢</div>
                    </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button onClick={() => handleSave('dream')} className="flex-1 py-3 rounded-xl bg-gradient-to-br from-[var(--accent2)] to-[var(--accent)] text-white font-bold shadow-lg shadow-purple-900/30 active:scale-95 transition-transform">
                    保存今天的夢 ✨
                </button>
                <button onClick={() => handleSave('no_dream')} className="px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 active:scale-95 transition-transform">
                    今天竟沒有發夢 😴
                </button>
            </div>
          </motion.section>
        ) : (
          <motion.section 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4"
          >
             <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋..." 
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0f1230] border border-[var(--border)] text-sm"
                    />
                </div>
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'dream' | 'no_dream')}
                    className="px-3 py-2 rounded-xl bg-[#0f1230] border border-[var(--border)] text-sm"
                >
                    <option value="all">全部</option>
                    <option value="dream">僅夢境</option>
                    <option value="no_dream">僅無夢</option>
                </select>
             </div>

             {/* Calendar Controls */}
             <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl mb-4">
                <div className="flex bg-[#0f1230] p-1 rounded-full border border-[var(--border)]">
                    {(['month', 'week', 'day'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setCalendarMode(m)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                                calendarMode === m ? "bg-[rgba(167,139,250,0.25)] text-white border border-[rgba(167,139,250,0.5)]" : "text-[var(--muted)] border border-transparent"
                            )}
                        >
                            {{month: '月', week: '週', day: '日'}[m]}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        d.setMonth(d.getMonth() - 1);
                        setCurrentDate(d);
                    }} className="p-2 rounded-lg bg-[#0f1230] border border-[var(--border)]"><ChevronLeft size={14}/></button>
                    <span className="font-bold min-w-[100px] text-center">
                        {currentDate.getFullYear()} 年 {currentDate.getMonth() + 1} 月
                    </span>
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        d.setMonth(d.getMonth() + 1);
                        setCurrentDate(d);
                    }} className="p-2 rounded-lg bg-[#0f1230] border border-[var(--border)]"><ChevronRight size={14}/></button>
                </div>
             </div>

             {/* Views */}
             {calendarMode === 'month' && (
                 <div className="grid grid-cols-7 gap-1.5 text-center">
                     {['日','一','二','三','四','五','六'].map(d => <div key={d} className="text-xs text-[var(--muted)] py-2">{d}</div>)}
                     {getDaysInMonth(currentDate).map((d, i) => {
                        if (!d) return <div key={`empty-${i}`} />;
                        const dateStr = d.toISOString().split('T')[0];
                        const dayDreams = dreams.filter(x => x.date === dateStr);
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDateStr;
                        
                        return (
                            <button 
                                key={dateStr}
                                onClick={() => { setSelectedDateStr(dateStr); setCalendarMode('day'); }}
                                className={cn(
                                    "relative h-16 rounded-xl border border-[var(--border)] bg-[#0f1230] p-1 flex flex-col items-start justify-between transition-all",
                                    isToday && "ring-2 ring-[var(--accent2)]",
                                    isSelected && "shadow-[inset_0_0_0_2px_var(--accent)]"
                                )}
                            >
                                <span className="text-xs opacity-70 ml-1">{d.getDate()}</span>
                                <div className="flex flex-wrap gap-0.5 px-1 w-full">
                                    {dayDreams.flatMap(dd => {
                                        try { return JSON.parse(dd.tags).slice(0, 3); } catch { return []; }
                                    }).map((tag: string, idx: number) => (
                                        <span key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTagColor(tag) }} />
                                    ))}
                                    {dayDreams.some(dd => dd.type === 'no_dream') && !dayDreams.some(dd => dd.type === 'dream') && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                    )}
                                </div>
                            </button>
                        );
                     })}
                 </div>
             )}

             {calendarMode === 'day' && (
                 <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent2)]/10 p-3 rounded-xl">
                        <h3 className="font-bold">{selectedDateStr}</h3>
                        <span className="text-xs text-[var(--muted)]">
                            {dreams.filter(d => d.date === selectedDateStr).length} 筆紀錄
                        </span>
                    </div>
                    {dreams.filter(d => d.date === selectedDateStr).map(dream => (
                        <div key={dream.id} className="bg-[#0f1230] border border-[var(--border)] rounded-xl p-4 relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                                    {dream.type === 'dream' ? '✨ 夢境' : '😴 無夢'} · {new Date(dream.createdAt).toLocaleTimeString()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(dream)} className="p-1 hover:text-[var(--accent)]"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDelete(dream.id)} className="p-1 hover:text-[var(--danger)]"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="whitespace-pre-wrap mb-3">{dream.content}</div>
                            {dream.analysis && (
                                <div className="mb-3 p-3 bg-[var(--surface)] rounded-lg text-xs border border-white/5">
                                    <span className="text-[var(--accent2)] font-bold">AI 分析：</span>
                                    {JSON.parse(dream.analysis).summary}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                                {(() => {
                                    try {
                                        return JSON.parse(dream.tags).map((t: string) => (
                                            <span key={t} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: getTagColor(t), color: '#ddd' }}>#{t}</span>
                                        ));
                                    } catch { return null; }
                                })()}
                            </div>
                        </div>
                    ))}
                    {dreams.filter(d => d.date === selectedDateStr).length === 0 && (
                        <div className="text-center py-10 text-[var(--muted)]">此日無紀錄</div>
                    )}
                 </div>
             )}

             {/* Export/Import */}
             <div className="mt-6 flex gap-2 border-t border-[var(--border)] pt-4">
                 <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/5">
                     <Download size={14} /> 匯出備份
                 </button>
                 <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-white/5">
                     <Upload size={14} /> 匯入備份
                 </button>
                 <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
             </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
